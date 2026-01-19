# 🛡️ Bastion Host Usage Guide

This guide explains how to securely access your private RDS database using the deployed Bastion Host and AWS Systems Manager (SSM) Session Manager.

**Note:** No SSH keys are required. Access is managed via IAM permissions.

## ✅ Prerequisites

1.  **AWS CLI installed and configured**
    *   Run `aws configure` with your credentials.
2.  **Session Manager Plugin installed**
    *   [Install Guide for Windows/Mac/Linux](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)

---

## 🚀 1. Connect to Bastion Shell

To get a shell access to the bastion instance (e.g., to run CLI tools inside the VPC):

1.  **Get the Instance ID:**
    ```powershell
    # PowerShell
    $InstanceId = aws cloudformation describe-stacks --stack-name onebt-rm-dev-bastion --region ap-southeast-1 --query "Stacks[0].Outputs[?OutputKey=='BastionInstanceId'].OutputValue" --output text
    Write-Host "Bastion Instance ID: $InstanceId"
    ```

    ```bash
    # Bash
    INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name onebt-rm-dev-bastion --region ap-southeast-1 --query "Stacks[0].Outputs[?OutputKey=='BastionInstanceId'].OutputValue" --output text)
    echo "Bastion Instance ID: $INSTANCE_ID"
    ```

2.  **Start Session:**
    ```bash
    aws ssm start-session --target $INSTANCE_ID --region ap-southeast-1
    ```

---

## 🔌 2. Port Forwarding (Connect with pgAdmin/TablePlus)

To access the private RDS database from your local machine (e.g., using pgAdmin, DBeaver, or TablePlus), you need to create a secure tunnel.

1.  **Get RDS Endpoint:**
    ```bash
    aws cloudformation describe-stacks --stack-name onebt-rm-dev-rds --region ap-southeast-1 --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" --output text
    ```
    *(Let's assume the output is `onebt-db-dev.xyz.ap-southeast-1.rds.amazonaws.com`)*

2.  **Start Port Forwarding Session:**
    This command forwards your local port `54320` (arbitrary) to the remote RDS port `5432` via the bastion.

    ```bash
    aws ssm start-session \
        --target i-04f6374dc7c76d13d \
        --region ap-southeast-1 \
        --document-name AWS-StartPortForwardingSessionToRemoteHost \
        --parameters '{"host":["onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["54320"]}'
    ```

    *Replace `<BASTION_INSTANCE_ID>` and `<RDS_ENDPOINT>` with actual values.*

3.  **Connect Your Database Client:**
    Now connect using your preferred tool:
    *   **Host:** `localhost`
    *   **Port:** `54320`
    *   **Database:** `resource_management_dev`
    *   **User:** `dbadmin`
    *   **Password:** *(Retrieve from SSM if needed)*
        ```bash
        aws ssm get-parameter --name "/1bt/dev/db-password" --with-decryption --query "Parameter.Value" --output text --region ap-southeast-1
        ```

---

## 🛠️ Troubleshooting

**"SessionManagerPlugin is not found"**
*   You must install the Session Manager Plugin (see Prerequisites). It is separate from the main AWS CLI.

**"Target not connected or not online"**
*   The bastion instance might be stopped to save costs.
*   Start it up:
    ```bash
    aws ec2 start-instances --instance-ids <BASTION_INSTANCE_ID> --region ap-southeast-1
    ```
*   Wait 1-2 minutes for it to come online.


Bastion Instance ID: i-04f6374dc7c76d13d
RDS Endpoint: onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com
DB Password: U2qSm0YId9BZXWRP6EnJ

aws ssm start-session --target i-04f6374dc7c76d13d --region ap-southeast-1 --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters "{\"host\":[\"onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"54320\"]}"