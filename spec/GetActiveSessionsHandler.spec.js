const { UNKNOWN_SESSION_DETAILS, collection: { SESSIONS }, endpoints: { http: { GET_ACTIVE_SESSIONS } } } = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus").testBus;
const { sessions } = require("./support/session-fixtures");

describe("GetActiveSessionsHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => db = connection.db));

	it("should be possible to get a user's session details", async () => {
		await db.collection(SESSIONS).insertMany(sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_ACTIVE_SESSIONS,
			message: {
				user: {
					id: sessions[0].userId,
					scopes: ["just-since-it's-required"]
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails === UNKNOWN_SESSION_DETAILS)
				return;

			expect(currentSessionDetails.lastActivity).toBeLessThan(sessionDetails[i - 1].lastActivity, "currentSessionDetails.lastActivity should be less than that of i - 1");
		});

		expect(sessionDetails[3]).toBe(UNKNOWN_SESSION_DETAILS, "sessionDetails[3] should be UNKNOWN_SESSION_DETAILS");
	});


});
