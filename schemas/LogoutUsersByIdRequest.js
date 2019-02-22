module.exports = {
	id: "LogoutUsersByIdRequest",
	additionalProperties: false,
	properties: {
		userIds: {
			type: "array",
			items: { type: "string" }
		}
	},
	required: ["userIds"]
}
