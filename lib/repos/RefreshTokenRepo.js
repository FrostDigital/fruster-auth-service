const constants = require("../../constants");
const uuid = require("uuid");

class RefreshTokenRepo {

	constructor(db) {		
		this.collection = db.collection(constants.collection.refreshTokens);	    
      	this.collection.ensureIndex({token: 1, });
	}

	create(userId, ttlMs) {	
	  return this.collection.insert({
	    id: uuid.v4(),
	    token: uuid.v4(),
	    userId: userId,
	    expired: false,
	    expires: new Date(Date.now() + ttlMs)
	  })
	  .then(res => {
	  	let createdRefreshToken = res.ops[0];
	  	delete createdRefreshToken._id;	  	
	  	return createdRefreshToken;
	  });	
	}

	get(token, allowExpired) {
		let query = {
			token: token
		};

		if(!allowExpired) {
			query.expired = false;
		}

		return this.collection.findOne(query, { _id: 0 });
	}

	expire(token) {
		return this.collection.findOneAndUpdate(
			{ token: token }, 
			{ $set: { expired: true } }, 
			{ 
				projection: { _id: 0 },
				returnOriginal: false
			})
			.then(res => {				
				if(res.value) {
					return res.value;
				}
				throw "Token does not exist";				
			});
	}
}

module.exports = RefreshTokenRepo;