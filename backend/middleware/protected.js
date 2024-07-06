const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const TwitterUser = require('../models/user_schema');

//for user authorization
module.exports = async (req, res, next) => {
    const authHeader = req.header('Authorization');
  
    const token = authHeader?.replace('Bearer ', '');
  
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
  
      const user = await TwitterUser.findById(decoded._id);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      req.user = user;
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      res.status(400).json({ error: 'Invalid token' });
    }
};