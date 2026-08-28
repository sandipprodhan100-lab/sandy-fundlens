import os
import json
import boto3
from botocore.exceptions import NoCredentialsError

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET") or os.getenv("S3_BUCKET")
# Custom endpoint for S3-compatible stores (e.g. Cloudflare R2: https://<account_id>.r2.cloudflarestorage.com)
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL") or os.getenv("AWS_S3_ENDPOINT")

# Local folder used to simulate S3 if credentials are not configured
LOCAL_LAKE_DIR = os.getenv("LOCAL_LAKE_DIR", os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "infrastructure", "local_data_lake")
))

# Ensure local simulation dir exists
if not AWS_ACCESS_KEY_ID or not AWS_S3_BUCKET:
    os.makedirs(LOCAL_LAKE_DIR, exist_ok=True)


class S3Connector:
    def __init__(self):
        self.use_local = not (AWS_ACCESS_KEY_ID and AWS_S3_BUCKET)
        if not self.use_local:
            client_kwargs = {
                "aws_access_key_id": AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
                "region_name": AWS_REGION,
            }
            if S3_ENDPOINT_URL:
                client_kwargs["endpoint_url"] = S3_ENDPOINT_URL
            self.s3 = boto3.client("s3", **client_kwargs)
            self.bucket = AWS_S3_BUCKET
        else:
            self.s3 = None
            self.bucket = None
            print(f"[Data Lake] AWS credentials not configured. Simulating data lake at: {LOCAL_LAKE_DIR}")

    def is_configured(self) -> bool:
        return not self.use_local

    def get_bytes(self, key: str) -> bytes:
        if self.use_local:
            path = os.path.join(LOCAL_LAKE_DIR, key.replace("/", os.sep))
            if not os.path.exists(path):
                return b""
            with open(path, "rb") as f:
                return f.read()
        else:
            try:
                response = self.s3.get_object(Bucket=self.bucket, Key=key)
                return response["Body"].read()
            except self.s3.exceptions.NoSuchKey:
                return b""

    def put_bytes(self, key: str, data: bytes, content_type: str = "binary/octet-stream"):
        if self.use_local:
            path = os.path.join(LOCAL_LAKE_DIR, key.replace("/", os.sep))
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(data)
        else:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type
            )

    def get_json(self, key: str):
        data = self.get_bytes(key)
        if not data:
            return None
        return json.loads(data.decode("utf-8"))

    def put_json(self, key: str, data) -> None:
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.put_bytes(key, payload, "application/json")

    def list_objects(self, prefix: str) -> list[dict]:
        """Returns a list of dicts with 'key', 'size' and 'last_modified'."""
        if self.use_local:
            folder = os.path.join(LOCAL_LAKE_DIR, prefix.replace("/", os.sep))
            if not os.path.exists(folder):
                return []
            results = []
            for root, _, files in os.walk(folder):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, LOCAL_LAKE_DIR)
                    key = rel_path.replace(os.sep, "/")
                    stat = os.stat(full_path)
                    results.append({
                        "key": key,
                        "size": stat.st_size,
                        "last_modified": stat.st_mtime
                    })
            return results
        else:
            try:
                paginator = self.s3.get_paginator("list_objects_v2")
                results = []
                for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                    if "Contents" in page:
                        for obj in page["Contents"]:
                            results.append({
                                "key": obj["Key"],
                                "size": obj["Size"],
                                "last_modified": obj["LastModified"].isoformat()
                            })
                return results
            except NoCredentialsError:
                return []

# Singleton instance
s3_lake = S3Connector()
