const log = require("fruster-log");
const bus = require("fruster-bus");
const mongo = require("mongodb");
const constants = require("./lib/constants");

const RefreshTokenRepo = require("./lib/repos/RefreshTokenRepo");
const SessionRepo = require("./lib/repos/SessionRepo");
const JWTManager = require("./lib/managers/JWTManager");

const CookieLoginHandler = require("./lib/handlers/login/CookieLoginHandler");
const TokenLoginHandler = require("./lib/handlers/login/TokenLoginHandler");
const LogOutHandler = require("./lib/handlers/LogOutHandler");
const RefreshTokenHandler = require("./lib/handlers/RefreshTokenHandler");
const DecodeTokenHandler = require("./lib/handlers/DecodeTokenHandler");
const GenerateJWTTokenHandler = require("./lib/handlers/GenerateJWTTokenHandler");
const ConvertTokenToCookieHandler = require("./lib/handlers/ConvertTokenToCookieHandler");
const LogOutUsersByIdHandler = require("./lib/handlers/LogOutUsersByIdHandler");

const docs = require('./lib/docs');
const Db = require("mongodb").Db;


module.exports.start = async (busAddress, mongoUrl) => {
	await bus.connect(busAddress);

	/** @type {Db}*/
	const db = await mongo.connect(mongoUrl);

	const isCookie = true;
	const isToken = false;

	const refreshTokenRepo = new RefreshTokenRepo(db);
	const sessionRepo = new SessionRepo(db);
	const jwtManager = new JWTManager(sessionRepo);

	const logOutHandler = new LogOutHandler(jwtManager);
	const cookieLoginHandler = new CookieLoginHandler(jwtManager);
	const tokenLoginHandler = new TokenLoginHandler(refreshTokenRepo, jwtManager);
	const convertTokenToCookieHandler = new ConvertTokenToCookieHandler(jwtManager);
	const refreshTokenHandler = new RefreshTokenHandler(refreshTokenRepo, jwtManager);
	const generateJWTTokenHandler = new GenerateJWTTokenHandler(tokenLoginHandler, cookieLoginHandler);
	const decodeTokenHandler = new DecodeTokenHandler(jwtManager);
	const logOutUsersByIdHandler = new LogOutUsersByIdHandler(jwtManager);

	const LogoutUsersByIdRequest = require("./schemas/LogoutUsersByIdRequest");

	/**
	 * HTTP
	 */
	bus.subscribe({
		subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
		requestSchema: constants.schemas.request.AUTH_REQUEST,
		docs: docs.http.LOGIN_WITH_COOKIE,
		handle: req => cookieLoginHandler.handle(req)
	});

	bus.subscribe({
		subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
		requestSchema: constants.schemas.request.AUTH_REQUEST,
		responseSchema: constants.schemas.response.TOKEN_AUTH_RESPONSE,
		docs: docs.http.LOGIN_WITH_TOKEN,
	}, req => tokenLoginHandler.handle(req));

	bus.subscribe({
		subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
		mustBeLoggedIn: true,
		docs: docs.http.CONVERT_TOKEN_TO_COOKIE,
	}, req => convertTokenToCookieHandler.handleHttp(req));

	bus.subscribe({
		subject: constants.endpoints.http.REFRESH_AUTH,
		docs: docs.http.REFRESH_AUTH,
		requestSchema: constants.schemas.request.REFRESH_AUTH,
		handle: req => refreshTokenHandler.handle(req)
	});

	bus.subscribe({
		subject: constants.endpoints.http.LOGOUT,
		mustBeLoggedIn: true,
		docs: docs.http.LOGOUT,
		handle: req => logOutHandler.handle(req)
	});

	/** DEPRECATED */
	bus.subscribe({
		subject: "http.post.auth.web",
		requestSchema: constants.schemas.request.AUTH_REQUEST,
		deprecated: `Use ${constants.endpoints.http.LOGIN_WITH_COOKIE} instead`,
		handle: req => cookieLoginHandler.handle(req)
	});
	/** DEPRECATED */
	bus.subscribe({
		subject: "http.post.auth.app",
		requestSchema: constants.schemas.request.AUTH_REQUEST,
		responseSchema: constants.schemas.response.TOKEN_AUTH_RESPONSE,
		deprecated: `Use ${constants.endpoints.http.LOGIN_WITH_TOKEN} instead`,
		handle: req => tokenLoginHandler.handle(req)
	});

	/**
	 * SERVICE
	 */
	bus.subscribe({
		subject: constants.endpoints.service.DECODE_TOKEN,
		requestSchema: constants.schemas.request.DECODE_TOKEN_REQUEST,
		docs: docs.service.DECODE_TOKEN,
		handle: req => decodeTokenHandler.handle(req)
	});

	bus.subscribe({
		subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
		requestSchema: constants.schemas.request.GENERATE_JWT_TOKEN_FOR_USER_REQUEST,
		docs: docs.shared.GENERATE_TOKEN_FOR_USER,
		handle: req => generateJWTTokenHandler.handle(req, isCookie)
	});

	bus.subscribe({
		subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_TOKEN,
		requestSchema: constants.schemas.request.GENERATE_JWT_TOKEN_FOR_USER_REQUEST,
		responseSchema: constants.schemas.response.TOKEN_AUTH_RESPONSE,
		docs: docs.shared.GENERATE_TOKEN_FOR_USER,
		handle: req => generateJWTTokenHandler.handle(req, isToken)
	});

	bus.subscribe({
		subject: constants.endpoints.service.LOGOUT_USERS_BY_ID,
		requestSchema: LogoutUsersByIdRequest,
		docs: docs.service.LOGOUT_USERS_BY_ID,
		handle: req => logOutUsersByIdHandler.handle(req)
	});

	/** DEPRECATED */
	bus.subscribe({
		subject: "auth-service.generate-jwt-token-for-user.web",
		deprecated: `Use ${constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE} instead`,
		handle: req => generateJWTTokenHandler.handle(req, isCookie)
	});
	/** DEPRECATED */
	bus.subscribe({
		subject: "auth-service.generate-jwt-token-for-user.app",
		deprecated: `Use ${constants.endpoints.service.GENERATE_TOKEN_FOR_USER_TOKEN} instead`,
		handle: req => generateJWTTokenHandler.handle(req, isToken)
	});

	log.info("Auth service is up and running");

	createIndexes(db);
};

function createIndexes(db) {
	/** Makes sure sessions expire and gets removed after the jwt token would have expired. */
	db.collection(constants.collection.SESSIONS)
		.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
	db.collection(constants.collection.SESSIONS)
		.createIndex({ userId: 1, id: 1 });
	db.collection(constants.collection.SESSIONS)
		.createIndex({ id: 1 }, { unique: true, partialFilterExpression: { id: { $exists: true } } });
}
