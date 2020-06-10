/** @typedef {import("../repos/SessionRepo")} SessionRepo */

class GetSessionDetailsByUserId {

    /**
     * @param {SessionRepo} sessionRepo
     */
	constructor(sessionRepo) {
		this._sessionRepo = sessionRepo;
	}

	async handle({ data: { userId } }) {
		const sessionsForUser = await this._sessionRepo.find({ userId });

		return {
			status: 200,
			data: sessionsForUser.map(({ sesionDetails }) => sesionDetails).filter(sessionDetails => !!sessionDetails)
		}
	}

}

module.exports = GetSessionDetailsByUserId;
