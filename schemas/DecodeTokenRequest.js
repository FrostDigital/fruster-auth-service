module.exports = {
	id: "DecodeTokenRequest",
	description: "The token to decode. To work optimally headers from the initial request should be sent in the headers of this request. This to be able to save things as `user-agent` & `version` in the session of the current user.",
	type: "string"
};
