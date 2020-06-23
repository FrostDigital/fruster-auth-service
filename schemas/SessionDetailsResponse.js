module.exports = {
	id: "SessionDetailsResponse",
	additionalProperties: false,
	properties: {
		sessionDetails: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					created: {
						type: ["string", "null"],
						format: "date-time",
						default: "2020-01-11T08:53:54.842Z"
					},
					lastActivity: {
						type: ["string", "null"],
						format: "date-time",
						default: "2020-06-11T08:53:54.842Z",
						description: "The date the user was last active. Active as in when it last made a request to the server."
					},
					userAgent: {
						type: ["string", "null"],
						default: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00"
					},
					version: {
						type: ["string", "null"],
						default: "13.0.1"
					}
				},
				required: [
					"created",
					"lastActivity",
					"userAgent",
					"version"
				]
			}
		},
		totalCount: {
			type: "integer",
			minimum: 0
		}
	},
	required: ["sessionDetails", "totalCount"]
};
