const { UNKNOWN_SESSION_DETAILS, collection: { SESSIONS }, endpoints: { service: { GET_SESSION_DETAILS_BY_USER_ID } } } = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus").testBus;
const { sessions } = require("./support/session-fixtures");

describe("GetSessionDetailsByUserIdHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => db = connection.db));

	it("should be possible to get a user's session details", async () => {
		await db.collection(SESSIONS).insertMany(sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: { userId: sessions[0].userId }
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

	it("should be possible to paginate result", async () => {
		await db.collection(SESSIONS).insertMany(sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: {
					userId: sessions[0].userId,
					page: 1,
					pageSize: 2
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(2, "sessionDetails should contain 2 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails === UNKNOWN_SESSION_DETAILS)
				return;

			expect(currentSessionDetails.lastActivity).toBeLessThan(sessionDetails[i - 1].lastActivity, "currentSessionDetails.lastActivity should be less than that of i - 1");
		});

		expect(sessionDetails[1]).toBe(UNKNOWN_SESSION_DETAILS, "sessionDetails[1] should be UNKNOWN_SESSION_DETAILS");
	});

	it("should be possible to sort result", async () => {
		await db.collection(SESSIONS).insertMany(sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: {
					userId: sessions[0].userId,
					sort: "created"
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails === UNKNOWN_SESSION_DETAILS)
				return;

			expect(currentSessionDetails.created).toBeLessThan(sessionDetails[i - 1].created, "currentSessionDetails.created should be less than that of i - 1");
		});
	});

	it("should be possible to use sort order on sorted result", async () => {
		await db.collection(SESSIONS).insertMany(sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: {
					userId: sessions[0].userId,
					sort: "created",
					sortOrder: 1
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails === UNKNOWN_SESSION_DETAILS || sessionDetails[i - 1] === UNKNOWN_SESSION_DETAILS)
				return;

			expect(currentSessionDetails.created).toBeGreaterThan(sessionDetails[i - 1].created, "currentSessionDetails.created should be less than that of i - 1");
		});
	});

});
