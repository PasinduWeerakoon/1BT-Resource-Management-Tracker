# 🛡️ Bastion Host Usage Guide

This guide explains how to securely access your private RDS database using the Bastion Host with SSH.

## ✅ Prerequisites

1. **AWS CLI installed and configured**
   - Run `aws configure` with your credentials.
2. **PEM Key File**
   - The key file `onebt-bastion-dev.pem` is located in `backend/infrastructure/`
   - **IMPORTANT:** Keep this file secure and never commit to version control

---

## 🔑 Connection Details

| Property                | Value                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **Bastion IP**          | `13.215.178.253`                                             |
| **Bastion Instance ID** | `i-0aa1977f8b318aada`                                        |
| **RDS Endpoint**        | `onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com` |
| **Database Name**       | `resource_management_dev`                                    |
| **Database User**       | `dbadmin`                                                    |

---

## 🚀 1. SSH to Bastion (Direct Shell Access)

To get shell access to the bastion instance:

```bash
# From the infrastructure directory
ssh -i onebt-bastion-dev.pem ec2-user@13.215.178.253
```

**First time connection?** You'll be asked to accept the host key - type `yes`.

Once connected, you can use `psql` to connect to RDS directly:

```bash
# Get the password from AWS Secrets Manager first (from your local machine)
aws secretsmanager get-secret-value \
    --secret-id "rds!db-83479c20-33e3-4a5e-aa06-3f2e2e73e749" \
    --query "SecretString" \
    --output text \
    --region ap-southeast-1 | jq -r '.password'

# Then on the bastion, connect to PostgreSQL
psql -h onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com \
     -U dbadmin \
     -d resource_management_dev
```

---

## 🔌 2. SSH Tunnel (Connect with pgAdmin/TablePlus/DBeaver)

To access the private RDS database from your local machine using a GUI tool:

### PowerShell (Windows)

```powershell
# Navigate to the infrastructure directory first
cd C:\Users\HIRUN\Documents\1BT\1BT-Resource-Management-Tracker\backend\infrastructure

# Start SSH tunnel - forwards local port 5433 to RDS port 5432
ssh -i onebt-bastion-dev.pem -L 5433:onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com:5432 -N ec2-user@13.215.178.253
```

### Bash (Mac/Linux)

```bash
# Navigate to the infrastructure directory first
cd ~/Documents/1BT/1BT-Resource-Management-Tracker/backend/infrastructure

# Make sure the key has correct permissions
chmod 400 onebt-bastion-dev.pem

# Start SSH tunnel
ssh -i onebt-bastion-dev.pem -L 5433:onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com:5432 -N ec2-user@13.215.178.253
```

### Connect Your Database Client

While the SSH tunnel is running, connect using:

| Setting      | Value                     |
| ------------ | ------------------------- |
| **Host**     | `localhost`               |
| **Port**     | `5433`                    |
| **Database** | `resource_management_dev` |
| **User**     | `dbadmin`                 |
| **Password** | _(See below)_             |

**Get the password:**

```powershell
# PowerShell
$secret = aws secretsmanager get-secret-value --secret-id "rds!db-83479c20-33e3-4a5e-aa06-3f2e2e73e749" --query "SecretString" --output text --region ap-southeast-1 | ConvertFrom-Json
$secret.password
```

```bash
# Bash
aws secretsmanager get-secret-value \
    --secret-id "rds!db-83479c20-33e3-4a5e-aa06-3f2e2e73e749" \
    --query "SecretString" \
    --output text \
    --region ap-southeast-1 | jq -r '.password'
```

---

## 🛠️ Troubleshooting

### "Permission denied (publickey)"

- Make sure you're using the correct `.pem` file
- On Mac/Linux, ensure correct permissions: `chmod 400 onebt-bastion-dev.pem`

### "Connection refused" or "Connection timed out"

- The bastion instance might be stopped. Start it:
  ```bash
  aws ec2 start-instances --instance-ids i-058ec151b188554e3 --region ap-southeast-1
  ```
- Wait 1-2 minutes for it to boot up

### Check Bastion Status

```bash
aws ec2 describe-instances --instance-ids i-0aa1977f8b318aada --region ap-southeast-1 --query "Reservations[0].Instances[0].{State:State.Name,PublicIp:PublicIpAddress}" --output table
```

### Bastion IP Changed?

If you stop/start the bastion, the public IP may change. Get the new IP:

```bash
aws cloudformation describe-stacks --stack-name onebt-infrastructure-dev --region ap-southeast-1 --query "Stacks[0].Outputs[?OutputKey=='BastionPublicIp'].OutputValue" --output text
```

---

## 🔒 Security Notes

1. **Never commit the `.pem` file** to version control
2. The bastion security group allows SSH (port 22) from anywhere - in production, restrict to your IP
3. Consider stopping the bastion instance when not in use to save costs:
   ```bash
   aws ec2 stop-instances --instance-ids i-0aa1977f8b318aada --region ap-southeast-1
   ```

---

## 📋 Quick Reference Commands

```bash
# SSH to bastion
ssh -i onebt-bastion-dev.pem ec2-user@13.215.178.253

# SSH tunnel for local DB access
ssh -i onebt-bastion-dev.pem -L 5433:onebt-db-dev.cpg2g0wb7axs.ap-southeast-1.rds.amazonaws.com:5432 -N ec2-user@13.215.178.253

# Get DB password
aws secretsmanager get-secret-value --secret-id "rds!db-83479c20-33e3-4a5e-aa06-3f2e2e73e749" --query "SecretString" --output text --region ap-southeast-1 | jq -r '.password'

# Start bastion if stopped
aws ec2 start-instances --instance-ids i-0aa1977f8b318aada --region ap-southeast-1

# Stop bastion to save costs
aws ec2 stop-instances --instance-ids i-0aa1977f8b318aada --region ap-southeast-1
```
