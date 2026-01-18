/**
 * Initialize Cognito Groups and Super Admin User
 * Run this script locally or via Lambda to setup Auth state
 */

const { CognitoIdentityProviderClient, CreateGroupCommand, AdminCreateUserCommand, AdminAddUserToGroupCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration
const REGION = 'ap-southeast-1';
const ENV = 'dev'; // Change as needed
const GROUPS = [
    { Name: 'SuperAdmin', Description: 'Full system access' },
    { Name: 'Admin', Description: 'Administrative access' },
    { Name: 'Lead', Description: 'Team lead access' },
    { Name: 'User', Description: 'Standard user access' }
];

const SUPER_ADMIN = {
    Username: 'superadmin',
    Email: 'hirun.dealwis@1billiontech.com',
    Password: 'Admin@123456' // Initial password
};

async function getStackOutput(outputKey) {
    // Simulating fetching from SSM or CloudFormation if not in env
    // For script simplicity, we'll try to fetch UserPoolId from SSM or assume it's passed via env
    if (process.env.COGNITO_USER_POOL_ID) return process.env.COGNITO_USER_POOL_ID;

    // Try to find stack output
    // Note: simpler to just paste it for this script or use AWS CLI to get it
    console.log('Env COGNITO_USER_POOL_ID not set. Fetching from CloudFormation...');
    // Implementation omitted for brevity, assuming user provides ID or we fetch it
    throw new Error('COGNITO_USER_POOL_ID environment variable is required');
}

async function main() {
    const cognito = new CognitoIdentityProviderClient({ region: REGION });

    try {
        const userPoolId = process.env.COGNITO_USER_POOL_ID;
        if (!userPoolId) {
            throw new Error('COGNITO_USER_POOL_ID environment variable is required');
        }

        console.log(`Initializing Cognito for UserPool: ${userPoolId}`);

        // 1. Create Groups
        for (const group of GROUPS) {
            try {
                await cognito.send(new CreateGroupCommand({
                    GroupName: group.Name,
                    Description: group.Description,
                    UserPoolId: userPoolId
                }));
                console.log(`✅ Group created: ${group.Name}`);
            } catch (error) {
                if (error.name === 'GroupExistsException') {
                    console.log(`ℹ️ Group exists: ${group.Name}`);
                } else {
                    console.error(`❌ Failed to create group ${group.Name}:`, error.message);
                }
            }
        }

        // 2. Create Super Admin User
        try {
            await cognito.send(new AdminCreateUserCommand({
                UserPoolId: userPoolId,
                Username: SUPER_ADMIN.Email, // Use email as username
                UserAttributes: [
                    { Name: 'email', Value: SUPER_ADMIN.Email },
                    { Name: 'email_verified', Value: 'true' },
                    { Name: 'name', Value: 'Super Admin' }
                ],
                MessageAction: 'SUPPRESS' // Don't send email matching DB seed
            }));
            console.log(`✅ Super Admin user created: ${SUPER_ADMIN.Email}`);

            // Set Password
            await cognito.send(new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: SUPER_ADMIN.Email,
                Password: SUPER_ADMIN.Password,
                Permanent: true
            }));
            console.log(`✅ Super Admin password set`);

        } catch (error) {
            if (error.name === 'UsernameExistsException') {
                console.log(`ℹ️ User exists: ${SUPER_ADMIN.Email}`);
            } else {
                console.error(`❌ Failed to create super admin:`, error.message);
            }
        }

        // 3. Assign SuperAdmin to Group
        try {
            await cognito.send(new AdminAddUserToGroupCommand({
                UserPoolId: userPoolId,
                Username: SUPER_ADMIN.Email,
                GroupName: 'SuperAdmin'
            }));
            console.log(`✅ Super Admin assigned to 'SuperAdmin' group`);
        } catch (error) {
            console.error(`❌ Failed to assign group:`, error.message);
        }

        console.log('Done!');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

main();
