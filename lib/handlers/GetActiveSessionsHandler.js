const { UNKNOWN_SESSION_DETAILS } = require("../constants");

/** @typedef {import("../repos/SessionRepo")} SessionRepo */

class GetActiveSessionsHandler {
    /**
     * @param {SessionRepo} sessionRepo
     */
	constructor(sessionRepo) {
		this._sessionRepo = sessionRepo;
	}

	async handleHttp({ user: { id: userId }, query: { sort, sortOrder, start, limit } }) {
		const { sessions, totalCount } = await this._sessionRepo.find({
			query: { userId },
			sort: {
				["sessionDetails." + (sort || "lastActivity")]: Number.parseInt(sortOrder) || -1
			},
			start: Number.parseInt(start),
			limit: Number.parseInt(limit)
		});

		return {
			status: 200,
			data: {
				totalCount,
				sessions: sessions
					.map(({ id, sessionDetails }) => {
						const returnVal = {
							id,
							lastActivity: null,
							created: null,
							version: null,
							userAgent: null
						};

						if (sessionDetails)
							return { ...returnVal, ...sessionDetails };
						else
							return returnVal;
					})
			}
		}
	}
}

module.exports = GetActiveSessionsHandler;
