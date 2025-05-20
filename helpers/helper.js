const crc32 = require("crc/crc32");
const md5   = require("md5")
const connection = require('../connection');
const jwt = require('jsonwebtoken');

function cpassword(password) {
	password = crc32(md5(password));
	return password;
};

const generateJWTToken = (user_id) => {
    return jwt.sign({ id: user_id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};
  
function sendToken(user_id, statusCode, res) {
    const token = generateJWTToken(user_id);
	const options = { 
	  httpOnly: true,
	};
	return token;
};

module.exports = {
	cpassword, sendToken
}