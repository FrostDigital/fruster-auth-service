const { UNKNOWN_SESSION_DETAILS } = require("../lib/constants");

module.exports = {
	id: "SessionDetailsResponse",
	additionalProperties: false,
	properties: {
		sessionDetails: {
			type: "array",
			items: {
				oneOf: [{
					type: "string",
					enum: [UNKNOWN_SESSION_DETAILS],
					description: "the session was created before session details was implemented"
				}, {
					type: "object",
					properties: {
						created: {
							type: "string",
							format: "date-time"
						},
						lastActivity: {
							type: "string",
							format: "date-time"
						},
						userAgent: {
							type: "string",
							default: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00",
							description: "E.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00"
						},
						version: { type: "string" }
					}
				}]
			}
		},
		totalCount: {
			type: "integer",
			minimum: 0
		}
	},
	required: ["sessionDetails", "totalCount"]
};
