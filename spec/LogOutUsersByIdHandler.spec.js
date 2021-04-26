const uuid = require("uuid");
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const constants = require("../lib/constants");

describe("LogOutUsersByIdHandler", () => {

	let collection;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async ({ db }) => { collection = db.collection(constants.collection.SESSIONS); }));

	const sessionFixture = () => ({
		id: uuid.v4(), // we don't really care about this, so just a random UUID
		userId: null,
		expires: "2019-03-04T17:33:10.406Z"
	});

	it("should be possible to several users", async () => {
		const reqId = "a-req-id";
		const userId1 = "ed9943df-046d-4874-8045-48c007df60a1";
		const userId2 = "39f49b2b-3576-43f1-86be-1c746b413f39";

		await collection.insert([{ ...sessionFixture(), userId: userId1 }, { ...sessionFixture(), userId: userId2 }]);

		const { status } = await bus.request({
			subject: constants.endpoints.service.LOGOUT_USERS_BY_ID,
			skipOptionsRequest: true,
			message: { reqId, data: { userIds: [userId1, userId2] } }
		});

		expect(status).toBe(200);

		const dbContents = await collection.find().toArray();

		expect(dbContents.length).toBe(0, "database should be empty");
	});

	it("should act like normal if a session for a user was not found", async () => {
		const reqId = "a-req-id";
		const userId1 = "ed9943df-046d-4874-8045-48c007df60a1";
		const userId2 = "39f49b2b-3576-43f1-86be-1c746b413f39";

		await collection.insert([{ ...sessionFixture(), userId: userId1 }]);

		const { status } = await bus.request({
			subject: constants.endpoints.service.LOGOUT_USERS_BY_ID,
			skipOptionsRequest: true,
			message: { reqId, data: { userIds: [userId1, userId2] } }
		});

		expect(status).toBe(200);

		const dbContents = await collection.find().toArray();

		expect(dbContents.length).toBe(0, "database should be empty");
	});

});
