const { UNKNOWN_SESSION_DETAILS } = require("../constants");

/** @typedef {import("../repos/SessionRepo")} SessionRepo */

class GetSessionDetailsByUserIdHandler {

    /**
     * @param {SessionRepo} sessionRepo
     */
	constructor(sessionRepo) {
		this._sessionRepo = sessionRepo;
	}

	async handle({ data: { userId, sort, sortOrder, start, limit } }) {
		const { sessions, totalCount } = await this._sessionRepo.find({
			query: { userId },
			sort: {
				["sessionDetails." + (sort || "lastActivity")]: Number.parseInt(sortOrder) || -1
			},
			start,
			limit
		});

		return {
			status: 200,
			data: {
				totalCount,
				sessionDetails: sessions
					.map(({ sessionDetails }) => {
						const returnVal = {
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

module.exports = GetSessionDetailsByUserIdHandler;
