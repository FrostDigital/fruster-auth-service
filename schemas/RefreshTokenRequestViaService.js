module.exports = {
	id: "RefreshTokenRequestViaService",
	description: "Request for refresh access token via service",
	properties: {
		refreshToken: {
			description: "the refresh token to refresh access token with",
			type: "string"
		},
		headers: {
			description: "The request header. The service uses authorization, version and user-agent header values",
			type: "object"
		},
		additionalPayload: {
			description: "Use for adding additional payload to the jwt encode data.",
			type: "object"
		}
	},
	required: ["refreshToken", "headers"]
}
