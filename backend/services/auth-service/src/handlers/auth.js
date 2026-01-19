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
    AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';
import createError from 'http-errors';
import { withMiddleware, success } from '/opt/nodejs/index.js';

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

        return success({
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            refreshToken: response.AuthenticationResult.RefreshToken,
            expiresIn: response.AuthenticationResult.ExpiresIn
        });
    } catch (error) {
        console.error('Login Error:', error.message);
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
        return success({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
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
        throw createError(400, 'Failed to set password');
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
