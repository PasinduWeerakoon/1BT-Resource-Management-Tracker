/**
 * Auth Service - Authentication Handlers
 * Microservice for all authentication operations
 */

import {
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand,
    GlobalSignOutCommand,
    AdminCreateUserCommand,
    AdminRespondToAuthChallengeCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    AdminAddUserToGroupCommand,
    AdminGetUserCommand,
    ListUsersCommand,
    AdminListGroupsForUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import createError from 'http-errors';
import { withMiddleware, success } from '/opt/nodejs/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'auth-service';

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

/**
 * Login Handler
 */
const loginHandler = async (event) => {
    const { email, password } = event.body;
    if (!email || !password) throw createError(400, 'Email and password required');

    try {
        const params = {
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };

        const response = await cognito.send(new AdminInitiateAuthCommand(params));

        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            return success({
                message: 'New password required',
                challenge: response.ChallengeName,
                session: response.Session
            });
        }

        // Extract user ID from the access token for audit logging
        const tokenPayload = JSON.parse(
            Buffer.from(response.AuthenticationResult.AccessToken.split('.')[1], 'base64').toString()
        );
        const userId = tokenPayload.sub || null;

        // Send audit event for successful login
        await audit.login(event, userId, email, SERVICE_NAME, {
            method: 'ADMIN_USER_PASSWORD_AUTH'
        });

        return success({
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            refreshToken: response.AuthenticationResult.RefreshToken,
            expiresIn: response.AuthenticationResult.ExpiresIn
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        // Send audit event for failed login
        await audit.loginFailed(event, email, SERVICE_NAME, { reason: error.message });
        throw createError(401, 'Invalid credentials');
    }
};

/**
 * Logout Handler
 */
const logoutHandler = async (event) => {
    const { accessToken } = event.body;

    if (!accessToken) {
        throw createError(400, 'Access Token required');
    }

    try {
        await cognito.send(new GlobalSignOutCommand({ AccessToken: accessToken }));

        // Send audit event for logout
        await audit.logout(event, null, null, SERVICE_NAME);

        return success({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        // Still send audit event even if signout partially fails
        await audit.logout(event, null, null, SERVICE_NAME, { partial: true });
        return success({ message: 'Logged out' });
    }
};

/**
 * Refresh Token Handler
 */
const refreshHandler = async (event) => {
    const { refreshToken } = event.body;
    if (!refreshToken) throw createError(400, 'Refresh Token required');

    try {
        const params = {
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        };

        const response = await cognito.send(new AdminInitiateAuthCommand(params));

        return success({
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            expiresIn: response.AuthenticationResult.ExpiresIn
        });
    } catch (error) {
        console.error('Refresh error:', error);
        throw createError(401, 'Invalid refresh token');
    }
};

/**
 * Forgot Password Handler
 */
const forgotPasswordHandler = async (event) => {
    const { email } = event.body;
    if (!email) throw createError(400, 'Email required');

    try {
        await cognito.send(new ForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: email
        }));
        return success({ message: 'Password reset code sent' });
    } catch (error) {
        // Don't reveal if user exists
        console.error('Forgot password error:', error);
        return success({ message: 'Password reset code sent' });
    }
};

/**
 * Reset Password Handler
 */
const resetPasswordHandler = async (event) => {
    const { email, code, newPassword } = event.body;
    if (!email || !code || !newPassword) throw createError(400, 'Missing fields');

    try {
        await cognito.send(new ConfirmForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword
        }));
        return success({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        throw createError(400, 'Failed to reset password');
    }
};

/**
 * Invite User Handler (Protected - Admin only)
 */
const inviteUserHandler = async (event) => {
    // User is already authenticated by JWT authorizer
    const callingUserGroups = event.user?.groups || [];

    // Check if caller has admin rights
    const isAdmin = callingUserGroups.includes('Admin') || callingUserGroups.includes('SuperAdmin');
    if (!isAdmin) {
        throw createError(403, 'Forbidden: Admin access required');
    }

    const { email, name, role } = event.body;
    if (!email) throw createError(400, 'Email required');

    try {
        await cognito.send(new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'name', Value: name || '' }
            ],
            DesiredDeliveryMediums: ['EMAIL']
        }));

        // Add to group if role specified
        if (role && ['Admin', 'User'].includes(role)) {
            await cognito.send(new AdminAddUserToGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                GroupName: role
            }));
        }

        return success({ message: `Invitation sent to ${email}` });
    } catch (error) {
        console.error('Invite error:', error);
        if (error.name === 'UsernameExistsException') {
            throw createError(409, 'User already exists');
        }
        throw createError(500, 'Failed to invite user');
    }
};

/**
 * Complete Invite Handler
 */
const completeInviteHandler = async (event) => {
    const { email, newPassword, session } = event.body;
    if (!email || !newPassword || !session) throw createError(400, 'Missing fields');

    try {
        const response = await cognito.send(new AdminRespondToAuthChallengeCommand({
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ChallengeResponses: {
                USERNAME: email,
                NEW_PASSWORD: newPassword
            },
            Session: session
        }));

        return success({
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            refreshToken: response.AuthenticationResult.RefreshToken
        });
    } catch (error) {
        console.error('Complete invite error:', error);

        // Return specific error messages for password policy violations
        if (error.name === 'InvalidPasswordException') {
            throw createError(400, error.message || 'Password does not meet requirements. Must include uppercase, lowercase, numbers, and special characters.');
        }
        if (error.name === 'ExpiredCodeException' || error.name === 'NotAuthorizedException') {
            throw createError(400, 'Session expired. Please request a new invitation.');
        }

        throw createError(400, 'Failed to set password');
    }
};

/**
 * Get Current User Handler
 * Returns user profile information from JWT claims
 */
const getCurrentUserHandler = async (event) => {
    // JWT claims are available from the authorizer
    const claims = event.requestContext?.authorizer?.jwt?.claims || {};
    const username = claims.sub || claims['cognito:username'];

    if (!username) {
        throw createError(401, 'Invalid token');
    }

    try {
        // Get full user details from Cognito
        const userResponse = await cognito.send(new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: username
        }));

        // Parse user attributes into a clean object
        const attributes = {};
        userResponse.UserAttributes?.forEach(attr => {
            attributes[attr.Name] = attr.Value;
        });

        return success({
            id: username,
            email: attributes.email || claims.email,
            name: attributes.name || '',
            emailVerified: attributes.email_verified === 'true',
            groups: claims['cognito:groups'] || [],
            createdAt: userResponse.UserCreateDate?.toISOString(),
            lastModified: userResponse.UserLastModifiedDate?.toISOString(),
            status: userResponse.UserStatus,
            enabled: userResponse.Enabled
        });
    } catch (error) {
        console.error('Get user error:', error);
        throw createError(500, 'Failed to get user information');
    }
};

/**
 * Get System Users Handler (Protected - Admin only)
 * Returns list of all users in the Cognito User Pool with their groups/roles
 */
const getSystemUsersHandler = async (event) => {
    // User is already authenticated by JWT authorizer
    const callingUserGroups = event.user?.groups || [];

    // Check if caller has admin rights
    const isAdmin = callingUserGroups.includes('Admin') || callingUserGroups.includes('SuperAdmin');
    if (!isAdmin) {
        throw createError(403, 'Forbidden: Admin access required');
    }

    try {
        // Get query parameters for pagination
        const limit = parseInt(event.queryStringParameters?.limit || '60', 10);
        const paginationToken = event.queryStringParameters?.paginationToken || null;

        // List all users from Cognito User Pool
        const listUsersParams = {
            UserPoolId: USER_POOL_ID,
            Limit: limit
        };

        if (paginationToken) {
            listUsersParams.PaginationToken = paginationToken;
        }

        const usersResponse = await cognito.send(new ListUsersCommand(listUsersParams));

        // For each user, get their groups and format the response
        const users = await Promise.all(
            (usersResponse.Users || []).map(async (user) => {
                // Parse user attributes
                const attributes = {};
                user.Attributes?.forEach(attr => {
                    attributes[attr.Name] = attr.Value;
                });

                // Get user groups
                let groups = [];
                try {
                    const groupsResponse = await cognito.send(new AdminListGroupsForUserCommand({
                        UserPoolId: USER_POOL_ID,
                        Username: user.Username
                    }));
                    groups = groupsResponse.Groups?.map(g => g.GroupName) || [];
                } catch (error) {
                    console.error(`Error getting groups for user ${user.Username}:`, error);
                    // Continue without groups if there's an error
                }

                // Determine user type based on groups
                let userType = 'User';
                if (groups.includes('SuperAdmin')) {
                    userType = 'Super Admin';
                } else if (groups.includes('Admin')) {
                    userType = 'Admin';
                }

                return {
                    id: user.Username,
                    email: attributes.email || user.Username,
                    name: attributes.name || '',
                    username: user.Username,
                    userType: userType,
                    groups: groups,
                    status: user.UserStatus === 'CONFIRMED' ? 'Active' :
                        user.UserStatus === 'FORCE_CHANGE_PASSWORD' ? 'Pending' :
                            user.UserStatus === 'UNCONFIRMED' ? 'Unconfirmed' :
                                user.UserStatus || 'Unknown',
                    enabled: user.Enabled !== false,
                    emailVerified: attributes.email_verified === 'true',
                    createdAt: user.UserCreateDate?.toISOString(),
                    lastModified: user.UserLastModifiedDate?.toISOString()
                };
            })
        );

        return success({
            users: users,
            paginationToken: usersResponse.PaginationToken || null,
            count: users.length
        });
    } catch (error) {
        console.error('Get system users error:', error);
        throw createError(500, 'Failed to get system users');
    }
};

// Export wrapped handlers
export const login = withMiddleware(loginHandler, { requireAuth: false, serviceName: 'auth-service' });
export const logout = withMiddleware(logoutHandler, { requireAuth: false, serviceName: 'auth-service' });
export const refresh = withMiddleware(refreshHandler, { requireAuth: false, serviceName: 'auth-service' });
export const forgotPassword = withMiddleware(forgotPasswordHandler, { requireAuth: false, serviceName: 'auth-service' });
export const resetPassword = withMiddleware(resetPasswordHandler, { requireAuth: false, serviceName: 'auth-service' });
export const inviteUser = withMiddleware(inviteUserHandler, { requireAuth: true, serviceName: 'auth-service' });
export const completeInvite = withMiddleware(completeInviteHandler, { requireAuth: false, serviceName: 'auth-service' });
export const getCurrentUser = withMiddleware(getCurrentUserHandler, { requireAuth: true, serviceName: 'auth-service', parseBody: false });
export const getSystemUsers = withMiddleware(getSystemUsersHandler, { requireAuth: true, serviceName: 'auth-service', parseBody: false });