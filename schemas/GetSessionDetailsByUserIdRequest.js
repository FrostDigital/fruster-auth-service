module.exports = {
	id: "GetSessionDetailsByUserIdRequest",
	additionalProperties: false,
	properties: {
		userId: {
			type: "string",
			format: "uuid"
		},
		sort: {
			type: "string",
			default: "lastActivity",
			description: "field in sessionDetails to sort by. Defaults to `lastActivity`"
		},
		sortOrder: {
			type: "integer",
			description: "defaults to -1",
			enum: [1, -1]
		},
		start: {
			type: "integer",
			description: "defaults to 0",
			minimum: 0
		},
		limit: {
			type: "integer",
			description: "defaults to 1000",
			minimum: 1
		}
	},
	required: ["userId"]
};
