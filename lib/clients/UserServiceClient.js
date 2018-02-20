const bus = require("fruster-bus");
const conf = require('../../conf');

class UserServiceClient {

    /**
     * Get user by id.
     * 
     * @param {String} reqId 
     * @param {String} userId 
     */
    async getUser(reqId, userId) {
        const res = await bus.request({
            subject: conf.userServiceGetUserSubject,
            skipOptionsRequest: true,
            message: {
                reqId,
                data: { id: userId }
            }
        });

        return res.data[0];
    }
}

module.exports = UserServiceClient;