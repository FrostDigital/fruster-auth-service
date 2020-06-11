const { UNKNOWN_SESSION_DETAILS, collection: { SESSIONS }, endpoints: { service: { GET_SESSION_DETAILS_BY_USER_ID } } } = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus").testBus;
const SessionFixtures = require("./support/session-fixtures");

describe("GetSessionDetailsByUserIdHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => db = connection.db));

	it("should be possible to get a user's session details", async () => {
		await db.collection(SESSIONS).insertMany(SessionFixtures.sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: { userId: SessionFixtures.sessions[0].userId }
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessionDetails[i - 1].created === null)
				return;

			expect(currentSessionDetails.lastActivity).toBeLessThan(sessionDetails[i - 1].lastActivity, "currentSessionDetails.lastActivity should be less than that of i - 1");
		});

		Object.values(sessionDetails[3]).forEach(value => expect(value).toBeNull());
	});

	it("should be possible to paginate result", async () => {
		await db.collection(SESSIONS).insertMany(SessionFixtures.sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: {
					userId: SessionFixtures.sessions[0].userId,
					start: 2,
					limit: 2
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(2, "sessionDetails should contain 2 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessionDetails[i - 1].created === null)
				return;

			expect(currentSessionDetails.lastActivity).toBeLessThan(sessionDetails[i - 1].lastActivity, "currentSessionDetails.lastActivity should be less than that of i - 1");
		});

		Object.values(sessionDetails[1]).forEach(value => expect(value).toBeNull());
	});

	it("should be possible to sort result", async () => {
		await db.collection(SESSIONS).insertMany(SessionFixtures.sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: {
					userId: SessionFixtures.sessions[0].userId,
					sort: "created"
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessionDetails[i - 1].created === null)
				return;

			expect(currentSessionDetails.created).toBeLessThan(sessionDetails[i - 1].created, "currentSessionDetails.created should be less than that of i - 1");
		});
	});

	it("should be possible to use sort order on sorted result", async () => {
		await db.collection(SESSIONS).insertMany(SessionFixtures.sessions);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: {
					userId: SessionFixtures.sessions[0].userId,
					sort: "created",
					sortOrder: 1
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessionDetails[i - 1].created === null)
				return;

			expect(currentSessionDetails.created).toBeGreaterThan(sessionDetails[i - 1].created, "currentSessionDetails.created should be less than that of i - 1");
		});
	});

	it("should not return expired sessions", async () => {
		const sessionsToInsert = [
			...SessionFixtures.sessions,
			{
				...SessionFixtures.sessions[0],
				expires: new Date("1970-01-01T00:00:00.001Z")
			}]

		await db.collection(SESSIONS).insertMany(sessionsToInsert);

		const { status, data: { sessionDetails, totalCount } } = await bus.request({
			subject: GET_SESSION_DETAILS_BY_USER_ID,
			message: {
				data: { userId: SessionFixtures.sessions[0].userId }
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessionDetails.length).toBe(4, "sessionDetails should contain 4 entries");

		sessionDetails.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessionDetails[i - 1].created === null)
				return;

			expect(currentSessionDetails.lastActivity).toBeLessThan(sessionDetails[i - 1].lastActivity, "currentSessionDetails.lastActivity should be less than that of i - 1");
		});

		Object.values(sessionDetails[3]).forEach(value => expect(value).toBeNull());
	});

});
