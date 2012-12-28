var mongoose = require('mongoose');
var config = require('../config');

mongoose.connect(config.production.dbUrl);

var userSchema = new mongoose.Schema({
	fbId: String,
	name: String,
	email: {type: String, lowercase: true},
	wins: {type: Number},
	losses: {type: Number}
});

module.exports = mongoose.model('User', userSchema);