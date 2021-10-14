module.exports = {
	id: "RefreshTokenResponse",
	properties: {
		accessToken: {
			description: "New accessToken",
			type: "string"
		}
	},
	required: ["accessToken"]
}
