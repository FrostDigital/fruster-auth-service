const { UNKNOWN_SESSION_DETAILS } = require("../constants");

/** @typedef {import("../repos/SessionRepo")} SessionRepo */

class GetActiveSessionsHandler {
    /**
     * @param {SessionRepo} sessionRepo
     */
	constructor(sessionRepo) {
		this._sessionRepo = sessionRepo;
	}

	async handleHttp({ user: { id: userId }, query: { sort, sortOrder, page, pageSize } }) {
		const { sessions, totalCount } = await this._sessionRepo.find({
			query: { userId },
			sort: {
				["sessionDetails." + (sort || "lastActivity")]: Number.parseInt(sortOrder) || -1
			},
			page,
			pageSize
		});

		return {
			status: 200,
			data: {
				totalCount,
				sessionDetails: sessions
					.map(({ sessionDetails }) => {
						if (sessionDetails)
							return sessionDetails;
						else
							return UNKNOWN_SESSION_DETAILS;
					})
			}
		}
	}
}

module.exports = GetActiveSessionsHandler;
