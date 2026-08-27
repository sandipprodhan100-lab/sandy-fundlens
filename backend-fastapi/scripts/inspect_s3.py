import os
import sys
import boto3
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=env_path)

ak = os.getenv("AWS_ACCESS_KEY_ID")
sk = os.getenv("AWS_SECRET_ACCESS_KEY")
reg = os.getenv("AWS_REGION", "ap-south-1")
bucket = os.getenv("AWS_S3_BUCKET", "mutualfundlens-s3")

s3 = boto3.client("s3", aws_access_key_id=ak, aws_secret_access_key=sk, region_name=reg)

paginator = s3.get_paginator("list_objects_v2")
count = 0
print(f"=== Inspecting S3 Bucket: {bucket} ({reg}) ===")
for page in paginator.paginate(Bucket=bucket):
    if "Contents" in page:
        for obj in page["Contents"]:
            count += 1
            print(f"{count}. {obj['Key']} ({obj['Size']} bytes, Last Modified: {obj['LastModified']})")

print(f"=== Total Objects Found: {count} ===")
