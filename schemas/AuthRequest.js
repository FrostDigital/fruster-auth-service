module.exports = {
	id: "AuthRequest",
	additionalProperties: true,
	properties: {
		username: {
			type: "string",
			description: "User's username, could for example be an email"
		},
		password: {
			type: "string",
			description: "User's password"
		}
	},
	required: [
		"username",
		"password"
	]
}
