const bus = require("fruster-bus");

class UserServiceClient {

    /**
     * Get user by id.
     * @param {String} reqId 
     * @param {String} userId 
     */
    async getUser(reqId, userId) {
        const res = await bus.request("user-service.get-user", {
            reqId: reqId,
            data: {
                id: userId
            }
        });

        return res.data[0];
    }
}

module.exports = UserServiceClient;