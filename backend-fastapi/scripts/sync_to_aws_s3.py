import os
import sys
import boto3
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load .env or .env.production.example
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production.example")
load_dotenv(dotenv_path=env_path)

from app.data_lake.s3_connector import LOCAL_LAKE_DIR

def purge_s3_bucket(s3_client, bucket_name: str, prefix: str = "nav/"):
    print(f"=== Purging/Cleaning existing data in s3://{bucket_name}/{prefix} ... ===", flush=True)
    paginator = s3_client.get_paginator("list_objects_v2")
    deleted_count = 0
    
    for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix):
        if "Contents" in page:
            objects_to_delete = [{"Key": obj["Key"]} for obj in page["Contents"]]
            if objects_to_delete:
                s3_client.delete_objects(
                    Bucket=bucket_name,
                    Delete={"Objects": objects_to_delete}
                )
                deleted_count += len(objects_to_delete)
                print(f"Deleted batch of {len(objects_to_delete)} objects...", flush=True)

    print(f"=== Purge Complete! Total old S3 objects deleted: {deleted_count} ===", flush=True)

def upload_local_lake_to_aws(bucket_name: str = None, region: str = None, access_key: str = None, secret_key: str = None, purge_first: bool = False):
    ak = access_key or os.getenv("AWS_ACCESS_KEY_ID")
    sk = secret_key or os.getenv("AWS_SECRET_ACCESS_KEY")
    reg = region or os.getenv("AWS_REGION", "ap-south-1")
    bucket = bucket_name or os.getenv("AWS_S3_BUCKET") or os.getenv("S3_BUCKET_NAME", "mutualfundlens-s3")
    
    print(f"=== Syncing Local Parquet Data Lake to AWS S3 Bucket: {bucket} ({reg}) ===", flush=True)

    if not ak or not sk:
        print("Error: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not provided.", flush=True)
        return False

    s3 = boto3.client("s3", aws_access_key_id=ak, aws_secret_access_key=sk, region_name=reg)

    if purge_first:
        purge_s3_bucket(s3, bucket, prefix="nav/")

    # Build existing S3 object size map for incremental sync
    existing_s3_objects = {}
    try:
        paginator = s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=bucket, Prefix="nav/"):
            if "Contents" in page:
                for obj in page["Contents"]:
                    existing_s3_objects[obj["Key"]] = obj["Size"]
    except Exception as e:
        print(f"Warning: Could not list existing S3 objects ({e}). Will perform full sync.", flush=True)

    uploaded_count = 0
    skipped_count = 0

    for root, _, files in os.walk(LOCAL_LAKE_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, LOCAL_LAKE_DIR)
            s3_key = rel_path.replace(os.sep, "/")
            
            local_size = os.path.getsize(full_path)
            
            # Skip if already synced with exact same size
            if s3_key in existing_s3_objects and existing_s3_objects[s3_key] == local_size:
                skipped_count += 1
                continue

            content_type = "application/json" if file.endswith(".json") else "application/vnd.apache.parquet"
            if file.endswith(".txt"):
                content_type = "text/plain"

            print(f"Uploading new/updated object [{uploaded_count + 1}]: {s3_key} ...", flush=True)
            with open(full_path, "rb") as f:
                s3.put_object(
                    Bucket=bucket,
                    Key=s3_key,
                    Body=f.read(),
                    ContentType=content_type
                )
            uploaded_count += 1

    print(f"=== Sync Complete! {uploaded_count} new/updated files uploaded, {skipped_count} unchanged files preserved in s3://{bucket}/ ===", flush=True)
    return True

if __name__ == "__main__":
    b_name = sys.argv[1] if len(sys.argv) > 1 else os.getenv("AWS_S3_BUCKET", "mutualfundlens-s3")
    upload_local_lake_to_aws(bucket_name=b_name, purge_first=False)

