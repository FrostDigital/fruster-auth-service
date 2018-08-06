const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../../lib/clients/UserServiceClient");

let mocks = module.exports;

mocks.getUsers = (returnUsers = []) => {
    testUtils.mockService({
        subject: UserServiceClient.endpoints.GET_USER,
        data: {
            totalCount: returnUsers.length,
            users: returnUsers
        }
    });
}