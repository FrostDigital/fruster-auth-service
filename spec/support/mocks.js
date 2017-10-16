const testUtils = require("fruster-test-utils");

let mocks = module.exports;

mocks.getUsers = (returnUsers = []) => {
    testUtils.mockService({
        subject: "user-service.get-user",
        data: returnUsers
    });
}