const jwt = require('jsonwebtoken');

const userLogedIn = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) return res.status(401).json("Header not found!!");

        const token = authHeader.split(" ")[1];

        if (!token) return res.status(401).json("You are not logged-in!! please login first!!");

        const user = jwt.verify(token, process.env.PRIVATE_KEY);
        req.user = user;

        next();
    } catch (error) {
        return res.status(500).json({ "ERROR": error });
    }
}

module.exports = userLogedIn;