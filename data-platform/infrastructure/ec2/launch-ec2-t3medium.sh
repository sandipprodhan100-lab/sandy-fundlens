#!/bin/bash
# ==============================================================================
# FundLens EC2 Provisioner (t3.medium in ap-south-1 Mumbai)
# ==============================================================================

set -e

AWS_REGION="${AWS_REGION:-ap-south-1}"
INSTANCE_TYPE="t3.medium"
KEY_NAME="${1:-fundlens-key}"

echo "====================================================================="
echo "Provisioning FundLens Airflow t3.medium Instance in $AWS_REGION..."
echo "Key Pair: $KEY_NAME"
echo "====================================================================="

# 1. Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
echo "Using VPC: $VPC_ID"

# 2. Create Security Group if not exists
SG_NAME="fundlens-airflow-sg"
SG_ID=$(aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=group-name,Values=$SG_NAME" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    echo "Creating Security Group $SG_NAME..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "FundLens Airflow and SSH access" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query "GroupId" --output text)

    # Allow SSH (Port 22) and Airflow Webserver (Port 8080)
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $AWS_REGION
    echo "Security Group created: $SG_ID"
else
    echo "Using existing Security Group: $SG_ID"
fi

# 3. Find latest Ubuntu 24.04 LTS AMI in ap-south-1
AMI_ID=$(aws ec2 describe-images \
    --region $AWS_REGION \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" "Name=state,Values=available" \
    --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" --output text)

echo "Selected Ubuntu 24.04 AMI: $AMI_ID"

# 4. Launch t3.medium EC2 Instance with User Data Bootstrap
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_DATA_FILE="$DIR/user-data-bootstrap.sh"

echo "Launching EC2 $INSTANCE_TYPE instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --region $AWS_REGION \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=fundlens-airflow-server},{Key=Project,Value=FundLens}]' \
    --user-data file://$USER_DATA_FILE \
    --query "Instances[0].InstanceId" --output text)

echo "====================================================================="
echo "SUCCESS! Instance Launched:"
echo "Instance ID : $INSTANCE_ID"
echo "Region      : $AWS_REGION"
echo "====================================================================="
echo ""
echo "Next step:"
echo "Add this Instance ID to your GitHub Secrets as AWS_EC2_INSTANCE_ID:"
echo "  gh secret set AWS_EC2_INSTANCE_ID -b \"$INSTANCE_ID\""
echo "====================================================================="
