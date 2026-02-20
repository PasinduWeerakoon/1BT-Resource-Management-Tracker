/**
 * Auth Service - Authentication Handlers
 * Microservice for all authentication operations
 * 
 * User-Employee Relationship:
 * - Not all employees are users (employees exist without login access)
 * - All users MUST be employees (user.employee_id is required)
 * - Admin/Super Admin can invite employees to become users with a role
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
import { getDrizzle } from '/opt/nodejs/database/drizzle.js';
import { employees, users } from '/opt/nodejs/database/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
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
 * Step 1: Creates Cognito user only (non-VPC function)
 * Frontend should call linkUserToEmployee after this succeeds
 */
const inviteUserHandler = async (event) => {
    const callingUserGroups = event.user?.groups || [];

    const isAdmin = callingUserGroups.includes('Admin') || callingUserGroups.includes('SuperAdmin');
    if (!isAdmin) {
        throw createError(403, 'Forbidden: Admin access required');
    }

    const { employee_id, email, name, role } = event.body;

    if (!employee_id) throw createError(400, 'Employee ID is required');
    if (!email) throw createError(400, 'Email is required');
    if (!name) throw createError(400, 'Name is required');
    if (!role) throw createError(400, 'Role is required');

    const validRoles = ['Super User', 'Admin', 'User'];
    if (!validRoles.includes(role)) {
        throw createError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const cognitoGroupMap = {
        'Super User': 'SuperAdmin',
        'Admin': 'Admin',
        'User': 'User'
    };
    const cognitoGroup = cognitoGroupMap[role];

    try {
        // Create Cognito user (sends invitation email)
        const cognitoResponse = await cognito.send(new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'name', Value: name }
            ],
            DesiredDeliveryMediums: ['EMAIL']
        }));

        const cognitoUserId = cognitoResponse.User?.Username;

        // Add to Cognito group
        await cognito.send(new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            GroupName: cognitoGroup
        }));

        // Trigger internal link-user API call to create DB record
        try {
            const domainName = event.requestContext?.domainName;
            const stage = event.requestContext?.stage || process.env.NODE_ENV || 'dev';

            if (domainName) {
                const linkUserUrl = `https://${domainName}/${stage}/api/v1/auth/link-user`;

                // Keep the same Authorization header from the incoming request (JWT Admin token)
                await fetch(linkUserUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': event.headers?.authorization || event.headers?.Authorization
                    },
                    body: JSON.stringify({
                        email: email,
                        role: role,
                        employee_id: employee_id,
                        cognito_user_id: cognitoUserId
                    })
                });
            }
        } catch (linkError) {
            console.error('Failed to auto-link user to employee in DB:', linkError);
            // We don't throw because the Cognito user was created successfully
        }

        // Audit log (uses SQS, no VPC needed)
        await audit.create(event, 'user', employee_id, email, {
            employeeId: employee_id,
            name: name,
            role: role,
            cognitoUserId: cognitoUserId
        }, SERVICE_NAME, { action: 'INVITE_USER_COGNITO' });

        return success({
            message: `Cognito user created and linked in database. Invitation sent to ${email}`,
            cognitoUserId: cognitoUserId,
            email: email,
            name: name,
            role: role,
            employeeId: employee_id
        });
    } catch (error) {
        console.error('Invite error:', error);

        if (error.name === 'UsernameExistsException') {
            throw createError(409, 'A Cognito user with this email already exists');
        }

        throw createError(500, 'Failed to create Cognito user: ' + error.message);
    }
};

/**
 * Link User to Employee Handler (Protected - Admin only)
 * Step 2: Creates database user record linked to employee (VPC function)
 * Called after inviteUser succeeds
 */
const linkUserToEmployeeHandler = async (event) => {
    const callingUserGroups = event.user?.groups || [];

    const isAdmin = callingUserGroups.includes('Admin') || callingUserGroups.includes('SuperAdmin');
    if (!isAdmin) {
        throw createError(403, 'Forbidden: Admin access required');
    }

    const { employee_id, email, role, cognito_user_id } = event.body;

    if (!employee_id) throw createError(400, 'Employee ID is required');
    if (!email) throw createError(400, 'Email is required');
    if (!role) throw createError(400, 'Role is required');
    if (!cognito_user_id) throw createError(400, 'Cognito User ID is required');

    try {
        const drizzle = await getDrizzle();

        // Verify employee exists
        const employeeResult = await drizzle
            .select({
                id: employees.id,
                name: employees.name,
                email: employees.email
            })
            .from(employees)
            .where(and(
                eq(employees.id, employee_id),
                isNull(employees.deletedAt)
            ));

        if (employeeResult.length === 0) {
            throw createError(404, 'Employee not found');
        }

        const employee = employeeResult[0];

        // Check if employee is already a user
        const existingUser = await drizzle
            .select({ id: users.id })
            .from(users)
            .where(and(
                eq(users.employeeId, employee_id),
                isNull(users.deletedAt)
            ));

        if (existingUser.length > 0) {
            throw createError(409, 'This employee is already linked to a user account');
        }

        // Check if email is already used
        const emailExists = await drizzle
            .select({ id: users.id })
            .from(users)
            .where(and(
                eq(users.email, email),
                isNull(users.deletedAt)
            ));

        if (emailExists.length > 0) {
            throw createError(409, 'A user with this email already exists in database');
        }

        // Create database user record
        const [newUser] = await drizzle
            .insert(users)
            .values({
                cognitoUserId: cognito_user_id,
                username: email,
                email: email,
                passwordHash: 'COGNITO_MANAGED',
                role: role,
                employeeId: employee_id,
                status: 'Pending',
                createdBy: event.user?.userId || null
            })
            .returning();

        // Audit log
        await audit.create(event, 'user', newUser.id, email, {
            employeeId: employee_id,
            employeeName: employee.name,
            role: role,
            cognitoUserId: cognito_user_id
        }, SERVICE_NAME, { action: 'LINK_USER_TO_EMPLOYEE' });

        return success({
            message: 'User record created and linked to employee',
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                employeeId: newUser.employeeId,
                employeeName: employee.name,
                status: newUser.status,
                cognitoUserId: newUser.cognitoUserId
            }
        });
    } catch (error) {
        console.error('Link user error:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError(500, 'Failed to create user record: ' + error.message);
    }
};

/**
 * Complete Invite Handler (Non-VPC)
 * Called when invited user sets their password for the first time
 * Only handles Cognito password change, returns tokens and info for DB update
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

        // Get the Cognito sub from the ID token
        const idToken = response.AuthenticationResult.IdToken;
        const tokenParts = idToken.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const cognitoSub = payload.sub;

        // Trigger internal activate-user API call to update DB record status
        try {
            const domainName = event.requestContext?.domainName;
            const stage = event.requestContext?.stage || process.env.NODE_ENV || 'dev';

            if (domainName) {
                const activateUserUrl = `https://${domainName}/${stage}/api/v1/auth/activate-user`;

                await fetch(activateUserUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        cognito_sub: cognitoSub
                    })
                });
            }
        } catch (activateError) {
            console.error('Failed to auto-activate database user:', activateError);
        }

        return success({
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            refreshToken: response.AuthenticationResult.RefreshToken,
            cognitoSub: cognitoSub,
            email: email
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
 * Activate User Handler (VPC)
 * Updates user status to Active after password is set
 * Called after completeInvite succeeds
 */
const activateUserHandler = async (event) => {
    const { email, cognito_sub } = event.body;

    if (!email) throw createError(400, 'Email is required');
    if (!cognito_sub) throw createError(400, 'Cognito sub is required');

    try {
        const drizzle = await getDrizzle();

        // Update user record
        const result = await drizzle
            .update(users)
            .set({
                cognitoUserId: cognito_sub,
                status: 'Active',
                updatedAt: new Date()
            })
            .where(eq(users.email, email))
            .returning();

        if (result.length === 0) {
            throw createError(404, 'User not found');
        }

        return success({
            message: 'User activated successfully',
            user: {
                id: result[0].id,
                email: result[0].email,
                status: result[0].status
            }
        });
    } catch (error) {
        console.error('Activate user error:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError(500, 'Failed to activate user: ' + error.message);
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

/**
 * Get Invitable Employees Handler
 * Returns employees who don't have user accounts yet (eligible for invitation)
 * Admin/SuperAdmin only
 */
const getInvitableEmployeesHandler = async (event) => {
    const callingUserGroups = event.user?.groups || [];
    const isAdmin = callingUserGroups.includes('Admin') || callingUserGroups.includes('SuperAdmin');

    if (!isAdmin) {
        throw createError(403, 'Forbidden: Admin access required');
    }

    try {
        const drizzle = await getDrizzle();

        // Get employees who don't have a user account
        // Using a left join and filtering for null user records
        const result = await drizzle.execute(`
            SELECT e.id, e.name, e.email, e.epf_no, d.name as designation_name, e.is_external, e.created_at
            FROM employees e
            LEFT JOIN designations d ON d.id = e.designation_id
            LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
            WHERE e.deleted_at IS NULL
            AND u.id IS NULL
            AND e.email IS NOT NULL
            ORDER BY e.name ASC
        `);

        const invitableEmployees = result.rows || result;

        return success({
            employees: invitableEmployees.map(e => ({
                id: e.id,
                name: e.name,
                email: e.email,
                epfNo: e.epf_no,
                designation: e.designation_name,
                isExternal: e.is_external,
                createdAt: e.created_at
            })),
            count: invitableEmployees.length
        });
    } catch (error) {
        console.error('Get invitable employees error:', error);
        throw createError(500, 'Failed to get invitable employees: ' + error.message);
    }
};

/**
 * Get DB Users Handler
 * Returns users from the database with their employee info
 * Admin/SuperAdmin only
 */
const getDbUsersHandler = async (event) => {
    const callingUserGroups = event.user?.groups || [];
    const isAdmin = callingUserGroups.includes('Admin') || callingUserGroups.includes('SuperAdmin');

    if (!isAdmin) {
        throw createError(403, 'Forbidden: Admin access required');
    }

    try {
        const drizzle = await getDrizzle();

        const result = await drizzle.execute(`
            SELECT u.id, u.cognito_user_id, u.username, u.email, u.role, u.status,
                   u.employee_id, u.created_at, u.updated_at,
                   e.name as employee_name, e.epf_no, d.name as designation_name
            FROM users u
            LEFT JOIN employees e ON e.id = u.employee_id
            LEFT JOIN designations d ON d.id = e.designation_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at DESC
        `);

        const dbUsers = result.rows || result;

        return success({
            users: dbUsers.map(u => ({
                id: u.id,
                cognitoUserId: u.cognito_user_id,
                username: u.username,
                email: u.email,
                role: u.role,
                status: u.status,
                employeeId: u.employee_id,
                employeeName: u.employee_name,
                epfNo: u.epf_no,
                designation: u.designation_name,
                createdAt: u.created_at,
                updatedAt: u.updated_at
            })),
            count: dbUsers.length
        });
    } catch (error) {
        console.error('Get DB users error:', error);
        throw createError(500, 'Failed to get users: ' + error.message);
    }
};

// Export wrapped handlers
export const login = withMiddleware(loginHandler, { requireAuth: false, serviceName: 'auth-service' });
export const logout = withMiddleware(logoutHandler, { requireAuth: false, serviceName: 'auth-service' });
export const refresh = withMiddleware(refreshHandler, { requireAuth: false, serviceName: 'auth-service' });
export const forgotPassword = withMiddleware(forgotPasswordHandler, { requireAuth: false, serviceName: 'auth-service' });
export const resetPassword = withMiddleware(resetPasswordHandler, { requireAuth: false, serviceName: 'auth-service' });
export const inviteUser = withMiddleware(inviteUserHandler, { requireAuth: true, serviceName: 'auth-service' });
export const linkUserToEmployee = withMiddleware(linkUserToEmployeeHandler, { requireAuth: true, serviceName: 'auth-service' });
export const completeInvite = withMiddleware(completeInviteHandler, { requireAuth: false, serviceName: 'auth-service' });
export const activateUser = withMiddleware(activateUserHandler, { requireAuth: false, serviceName: 'auth-service' });
export const getCurrentUser = withMiddleware(getCurrentUserHandler, { requireAuth: true, serviceName: 'auth-service', parseBody: false });
export const getSystemUsers = withMiddleware(getSystemUsersHandler, { requireAuth: true, serviceName: 'auth-service', parseBody: false });
export const getInvitableEmployees = withMiddleware(getInvitableEmployeesHandler, { requireAuth: true, serviceName: 'auth-service', parseBody: false });
export const getDbUsers = withMiddleware(getDbUsersHandler, { requireAuth: true, serviceName: 'auth-service', parseBody: false });
