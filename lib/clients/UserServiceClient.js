const bus = require("fruster-bus");

/**
 * Note: this service client was generated automatically by api doc @ 2020-01-21T10:42:25.816Z
 */
class UserServiceClient {

	/**
	 * All endpoints
	 */
	static get endpoints() {

		return {

			GET_USERS_BY_QUERY: "user-service.get-users-by-query",
			VALIDATE_PASSWORD: "user-service.validate-password"

		};

	}

	/**
	 * @typedef {Object} GetUsersByQueryRequestFilter mongodb like filtering object in a String: Number fashion: firstName: 0 to exclude & firstName: 1 to include.
	 *
	 * @property {Number=} id Just an example property.
	 */

	/**
	 * @typedef {Object} GetUsersByQueryRequestSort mongodb like sort object in a String: Number fashion, e.g. { id: 1} to sort by id.
	 *
	 * @property {Number=} id Just an example property.
	 */

	/**
	 * @typedef {Object} GetUsersByQueryResponseUsers A fruster user. Without any custom fields:
	 *
	 * @property {String=} id Id of the user:
	 * @property {String=} firstName The first name of the user.
	 * @property {String=} lastName The last name of the user
	 * @property {String=} middleName the middle name of the user.
	 * @property {String=} email the email of the user.
	 * @property {Array<String>=} roles the roles of the user.
	 * @property {Array<String>=} scopes the scopes of the roles of the user.
	 */

	/**
	 * @typedef {Object} GetUsersByQueryResponse
	 *
	 * @property {Number=} totalCount The total count of results in the databse found with provided query
	 * @property {Array<GetUsersByQueryResponseUsers>=} users Response with an array of users.
	 */

	/**
	 * @typedef {Object} UserResponse
	 *
	 * @property {String=} id Id of the user:
	 * @property {String=} firstName The first name of the user.
	 * @property {String=} lastName The last name of the user
	 * @property {String=} middleName the middle name of the user.
	 * @property {String=} email the email of the user.
	 * @property {Array<String>=} roles the roles of the user.
	 * @property {Array<String>=} scopes the scopes of the roles of the user.
	 */

	/**
	 * Gets users by query.  **Note:** Return data may vary depending on the configuration. Configured user fields: **REQUIRED_ONLY** (Will always return id,email,password,roles,scopes)

 Can be expanded to return both user and profile data using `expand: "profile"` if configured to split the data. If expand is used; the query can be used to query profile fields as well: `{ "profile.firstName": "Bob" }`. With expand; the data is returned `{...userData, profile: {...profileData}}`
	 *
	 * @param {Object} param0
	 * @param {String} param0.reqId the request id
	 * @param {Object} param0.query mongodb like query object in a String: any fashion, e.g. { id: { $in: ['7a967d8b-8a25-4d20-b0e9-8ebe9383d488', '9f6b47c0-628c-45ca-8c43-8a99bf37e241'] }} to get users with ids '7a967d8b-8a25-4d20-b0e9-8ebe9383d488' and '9f6b47c0-628c-45ca-8c43-8a99bf37e241.'
	 * @param {GetUsersByQueryRequestFilter=} param0.filter mongodb like filtering object in a String: Number fashion: firstName: 0 to exclude & firstName: 1 to include.
	 * @param {Number=} param0.start Index to start results from.
	 * @param {Number=} param0.limit Number of results.
	 * @param {GetUsersByQueryRequestSort=} param0.sort mongodb like sort object in a String: Number fashion, e.g. { id: 1} to sort by id.
	 * @param {String=} param0.expand Whether or not to expand user object with its profile.
	 * @param {Boolean=} param0.caseInsensitiveSort Whether or not to use case insensitive sorting. This only works with sorting on string values. E.g. sort = { firstName: 1 }
	 *
	 * @return {Promise<GetUsersByQueryResponse>}
	 */
	static async getUsersByQuery({ reqId, query, filter, start, limit, sort, expand, caseInsensitiveSort }) {
		return (await bus.request({
			subject: UserServiceClient.endpoints.GET_USERS_BY_QUERY,
			message: {
				reqId,
				data: {
					query, filter, start, limit, sort, expand, caseInsensitiveSort
				}
			}
		})).data;
	}

	/**
	 * Validates that inputted password becomes the same hash as for an account. Typically used by auth service for login. Response has status code `200` if successful. Validation can be done on email
	 *
	 * @param {Object} param0
	 * @param {String} param0.reqId the request id
	 * @param {String} param0.username The username of the account to validate. Determined by config.USERNAME_VALIDATION_DB_FIELD.
	 * @param {String} param0.password The password to validate against account with.
	 * @param {Object=} param0.additionalQuery
	 *
	 * @return {Promise<UserResponse>}
	 */
	static async validatePassword({ reqId, username, password, additionalQuery }) {
		return (await bus.request({
			subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
			message: {
				reqId,
				data: {
					username, password, additionalQuery
				}
			}
		})).data;
	}

}

module.exports = UserServiceClient;
