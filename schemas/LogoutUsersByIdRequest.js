module.exports = {
	id: "LogOutUsersByIdRequest",
	additionalProperties: false,
	properties: {
		userIds: {
			type: "array",
			items: {
				type: "string",
				format: "uuid"
			}
		}
	},
	required: ["userIds"]
}
