const { collection: { SESSIONS }, endpoints: { http: { GET_ACTIVE_SESSIONS } } } = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const { sessions: mockSessions } = require("./support/session-fixtures");
const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus").testBus;
const Db = require("mongodb").Db;

describe("GetActiveSessionsHandler", () => {

	const user = {
		id: mockSessions[0].userId,
		scopes: ["just-since-it's-required"]
	};

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => db = connection.db));

	it("should be possible to get a user's session details", async () => {
		await db.collection(SESSIONS).insertMany(mockSessions);

		const { status, data: { sessions, totalCount } } = await bus.request({
			subject: GET_ACTIVE_SESSIONS,
			message: { user }
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessions.length).toBe(4, "sessions should contain 4 entries");

		sessions.forEach((currentSession, i) => {
			expect(currentSession.id).toBeDefined();

			if (i === 0 || currentSession.created === null || sessions[i - 1].created === null)
				return;

			expect(currentSession.lastActivity).toBeLessThan(sessions[i - 1].lastActivity, "sessions.lastActivity should be less than that of i - 1");
		});

		expectUnknownSession(sessions[3]);
	});


	it("should be possible to paginate result", async () => {
		await db.collection(SESSIONS).insertMany(mockSessions);

		const { status, data: { sessions, totalCount } } = await bus.request({
			subject: GET_ACTIVE_SESSIONS,
			message: {
				user,
				query: {
					start: "2",
					limit: "2"
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessions.length).toBe(2, "sessions should contain 2 entries");

		sessions.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessions[i - 1].created === null)
				return;

			expect(currentSessionDetails.lastActivity).toBeLessThan(sessions[i - 1].lastActivity, "currentSessionDetails.lastActivity should be less than that of i - 1");
		});

		expectUnknownSession(sessions[1]);
	});

	it("should be possible to sort result", async () => {
		await db.collection(SESSIONS).insertMany(mockSessions);

		const { status, data: { sessions, totalCount } } = await bus.request({
			subject: GET_ACTIVE_SESSIONS,
			message: {
				user,
				query: { sort: "created" }
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessions.length).toBe(4, "sessions should contain 4 entries");

		sessions.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessions[i - 1].created === null)
				return;

			expect(currentSessionDetails.created).toBeLessThan(sessions[i - 1].created, "currentSessionDetails.created should be less than that of i - 1");
		});
	});

	it("should be possible to use sort order on sorted result", async () => {
		await db.collection(SESSIONS).insertMany(mockSessions);

		const { status, data: { sessions, totalCount } } = await bus.request({
			subject: GET_ACTIVE_SESSIONS,
			message: {
				user,
				query: {
					sort: "created",
					sortOrder: "1"
				}
			}
		});

		expect(status).toBe(200, "status");
		expect(totalCount).toBe(4, "totalCount");
		expect(sessions.length).toBe(4, "sessions should contain 4 entries");

		sessions.forEach((currentSessionDetails, i) => {
			if (i === 0 || currentSessionDetails.created === null || sessions[i - 1].created === null)
				return;

			expect(currentSessionDetails.created).toBeGreaterThan(sessions[i - 1].created, "currentSessionDetails.created should be less than that of i - 1");
		});
	});

	function expectUnknownSession(session) {
		Object.keys(session).forEach(key => {
			const value = session[key];

			if (key === "id")
				expect(value).toBeDefined();
			else
				expect(value).toBeNull();
		});
	}

});
