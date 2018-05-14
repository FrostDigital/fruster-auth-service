const bus = require("fruster-bus");
const conf = require('../../conf');

class UserServiceClient {

    static get endpoints() {

        return {

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
    async getUser(reqId, userId) {
        const res = await this.getUsers(reqId, { id: userId });

        return res ? res[0] : null;
    }

    /**
     * Gets users by query.
     * 
     * @param {String} reqId 
     * @param {Object} query 
     */
    async getUsers(reqId, query) {
        const res = await bus.request({
            subject: UserServiceClient.endpoints.GET_USER,
            skipOptionsRequest: true,
            message: {
                reqId,
                data: query
            }
        });

        return res.data;
    }

    /**
     * Validates a user's password.
     * 
     * @param {String} reqId 
     * @param {Object} credentials
     * @param {String} credentials.username
     * @param {String} credentials.password
     */
    async validatePassword(reqId, credentials) {
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