import os
import sys
import boto3

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.data_lake.s3_connector import LOCAL_LAKE_DIR

def upload_local_lake_to_aws(bucket_name: str, region: str = "ap-south-1", access_key: str = None, secret_key: str = None):
    print(f"=== Syncing Local Parquet Data Lake to AWS S3 Bucket: {bucket_name} ({region}) ===")
    
    ak = access_key or os.getenv("AWS_ACCESS_KEY_ID")
    sk = secret_key or os.getenv("AWS_SECRET_ACCESS_KEY")
    
    if not ak or not sk:
        print("Error: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not provided.")
        return False

    s3 = boto3.client("s3", aws_access_key_id=ak, aws_secret_access_key=sk, region_name=region)

    uploaded_count = 0
    for root, _, files in os.walk(LOCAL_LAKE_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, LOCAL_LAKE_DIR)
            s3_key = rel_path.replace(os.sep, "/")
            
            content_type = "application/json" if file.endswith(".json") else "application/vnd.apache.parquet"
            if file.endswith(".txt"):
                content_type = "text/plain"

            print(f"Uploading: {s3_key} ...")
            with open(full_path, "rb") as f:
                s3.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=f.read(),
                    ContentType=content_type
                )
            uploaded_count += 1

    print(f"=== Upload Complete! {uploaded_count} files synced to s3://{bucket_name}/ ===")
    return True

if __name__ == "__main__":
    b_name = sys.argv[1] if len(sys.argv) > 1 else os.getenv("AWS_S3_BUCKET", "fundnavigator-data-lake")
    upload_local_lake_to_aws(b_name)
