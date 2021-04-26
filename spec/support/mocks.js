const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../../lib/clients/UserServiceClient");
const { userServiceGetUserSubject } = require('../../conf');

let mocks = module.exports;

mocks.getUsers = (returnUsers = []) => {
	testUtils.mockService({
		subject: userServiceGetUserSubject,
		response: {
			data: {
				totalCount: returnUsers.length,
				users: returnUsers
			}
		}
	});
}

mocks.validatePassword = () => {
	testUtils.mockService({
		subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
		response: {
			data: { id: "id" }
		}
	});
}
