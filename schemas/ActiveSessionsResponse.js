module.exports = {
	id: "ActiveSessionsResponse",
	additionalProperties: false,
	properties: {
		sessions: {
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
						default: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00",
						description: "E.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.00"
					},
					version: {
						type: ["string", "null"],
						default: "13.0.1"
					},
					id: {
						type: "string",
						default: "35f6beb598a8e879d6921305a701715d1f3a1a6ddeb42d21c1068f3df2446fe431a9228e6699cbb23605b03ad0e6f5d273f95064bef48985f41d672d906ef5ef",
					}
				},
				required: ["created", "lastActivity", "userAgent", "version", "id"]
			}
		},
		totalCount: {
			type: "integer",
			minimum: 0
		}
	},
	required: ["sessions", "totalCount"]
};
