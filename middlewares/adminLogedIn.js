const jwt = require('jsonwebtoken');
const jwt_sec = 'Admin';

const adminLogedIn = (req, res, next) => {
    const header = req.header('Authorization');
    const token = header.split(" ")[1];

    if (!token) return res.status(401).json({ "ERROR": "Admin Unauthorized!!" });

    const data = jwt.verify(token, jwt_sec);

    req.admin = data;
    next();
}

module.exports = adminLogedIn;
