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
			default: -1,
			description: "defaults to -1"
		},
		page: {
			type: "integer",
			default: 0,
			description: "defaults to 0"
		},
		pageSize: {
			type: "integer",
			default: 1000,
			description: "defaults to 1000"
		}
	},
	required: ["userId"]
};
