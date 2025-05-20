const jwt   = require("jsonwebtoken");
const mysql = require("../connection");

exports.isAuthenticatedUser = async (req, res, next) => {
  try 
  {
    const BrToken = req.headers.authorization;
    let token;
    console.log(BrToken, "my token");
    if (BrToken && BrToken.startsWith('Bearer')) 
    {
      token = BrToken.split(' ')[1];
    }
    if (!token) 
    {
      return res.status(401).json({error: "2", error_message: 'Please Login to access' });
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user_id     = decodedData.id;
    console.log(user_id, "here is my user_id");
    console.log(decodedData, "decodedData");
    mysql.query(`SELECT * FROM users WHERE user_id = ?`, [user_id], (error, results, fields) => {
      if (error) 
      {
        return res.status(500).json({ error_message: "Internal server error" });
      } 
      else if (results.length == 0) 
      {
        return res.status(404).json({ error_message: "User not found" });
      } 
      else 
      {
        console.log(results);
        const user = results[0];
        req.user   = user; 
        console.log(user, "data is here");
        next();
      }
    });
  } 
  catch (err) 
  {
    console.log(err);
    return res.status(400).json({error:"2", error_message: "Invalid token" });
  }
};