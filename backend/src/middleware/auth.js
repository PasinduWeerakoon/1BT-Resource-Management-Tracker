import jwt from 'jsonwebtoken';
const { decode } = jwt;
import createError from 'http-errors';

/**
 * Authentication Middleware
 * 1. Decodes JWT token from checks (verified by API Gateway Authorizer)
 * 2. Extracts User Role / Groups
 * 3. Validates against allowed roles
 */

const authMiddleware = (allowedGroups = []) => {
    return {
        before: async (handler) => {
            const { event } = handler;

            // API Gateway with Cognito Authorizer attaches claims to requestContext.authorizer.claims
            const claims = event.requestContext?.authorizer?.claims;

            if (!claims) {
                // If no authorizer attached (and not explicitly public), deny
                // However, usually public routes won't use this middleware
                console.warn('No claims found in request context');
                throw createError(401, 'Unauthorized');
            }

            // Extract groups from Cognito token
            // Cognito stores groups in 'cognito:groups' array
            let userGroups = claims['cognito:groups'];

            // Handle case where it might be a string (single group) or not present
            if (!userGroups) {
                userGroups = [];
            } else if (typeof userGroups === 'string') {
                // Sometimes comes as "[Group1, Group2]" string or single "Group1"
                // Standard Cognito claims usually array or comma-separated string?
                // Actually in Lambda Proxy integration, it often comes as an array or a string like "[Group1]"
                // Let's safe parse it
                if (userGroups.startsWith('[') && userGroups.endsWith(']')) {
                    userGroups = userGroups.slice(1, -1).split(', ');
                } else {
                    userGroups = [userGroups];
                }
            }

            // Attach user info to event for handler processing
            event.user = {
                id: claims.sub,
                email: claims.email,
                name: claims.name,
                groups: userGroups,
                username: claims['cognito:username'] || claims.username
            };

            console.log(`User: ${event.user.email}, Groups: ${userGroups}`);

            // RBAC Check
            // If allowedGroups is empty, it means just authentication is required (Any valid user)
            if (allowedGroups.length > 0) {
                const hasPermission = userGroups.some(group => allowedGroups.includes(group));

                // SuperAdmin always has access if we want? Or explicit?
                // Let's make SuperAdmin explicit in allowedGroups or global override
                const isSuperAdmin = userGroups.includes('SuperAdmin');

                if (!hasPermission && !isSuperAdmin) {
                    console.warn(`Access denied. User groups: ${userGroups}, Required: ${allowedGroups}`);
                    throw createError(403, 'Forbidden: Insufficient Permissions');
                }
            }
        }
    };
};

export default authMiddleware;
