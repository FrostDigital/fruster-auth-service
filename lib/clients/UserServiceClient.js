const bus = require("fruster-bus");
const conf = require('../../conf');


class UserServiceClient {

    static get endpoints() {

        return {

            GET_USERS_BY_QUERY: "user-service.get-users-by-query",
            GET_USER: conf.userServiceGetUserSubject,
            VALIDATE_PASSWORD: "user-service.validate-password"

        };

    }

    /**
     * Get user by id.
     * 
     * @param {String} reqId 
     * @param {String} userId 
     */
    static async getUser(reqId, userId) {
        const res = await UserServiceClient.getUsers(reqId, { id: userId });
        return res ? res[0] : null;
    }

    /**
     * Gets users by query.
     * 
     * @param {String} reqId 
     * @param {Object} query 
     */
    static async getUsers(reqId, query) {
        let useLegacyCall = false;

        /** If subject has been configured to be something else than the default config we should use legacy calling to not break old projects. */
        if (UserServiceClient.endpoints.GET_USER !== UserServiceClient.endpoints.GET_USERS_BY_QUERY)
            useLegacyCall = true;

        let res;

        if (useLegacyCall)
            res = await bus.request({
                subject: UserServiceClient.endpoints.GET_USER,
                skipOptionsRequest: true,
                message: { reqId, data: query }
            });
        else
            res = await bus.request({
                subject: UserServiceClient.endpoints.GET_USER,
                skipOptionsRequest: true,
                message: { reqId, data: { query, expand: "true" } }
            });

        /** Make sure it works with the older configured (non fruster-core) endpoints where users are returned in an array*/
        return Array.isArray(res.data) ? res.data : res.data.users;
    }

    /**
     * Validates a user's password.
     * 
     * @param {String} reqId 
     * @param {Object} credentials
     * @param {String} credentials.username
     * @param {String} credentials.password
     */
    static async validatePassword(reqId, credentials) {
        const validatedUserResp = await bus.request({
            subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
            skipOptionsRequest: true,
            message: {
                reqId: reqId,
                data: credentials
            }
        });

        return validatedUserResp;
    }
}

module.exports = UserServiceClient;