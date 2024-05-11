// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    console.log("token is : ", token)
    if (!token) return res.status(401).json({ message: 'Authentication failed no token' });

    jwt.verify(token.replace('Bearer ', ''), 'bf3ab437d9c353bc4dc2d3f2cce44c096f17ed57792e58bd09640c89f6376c7b', (err, decoded) => {
      console.log("token verified")
      console.log("error", err)
      if (err) return res.status(403).json({ message: 'Authentication failed' });

      req.userId = decoded.userId;
      console.log("Received Token:", token);
console.log("Decoded Payload:", decoded);
       console.log("auth success");
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authenticate;
