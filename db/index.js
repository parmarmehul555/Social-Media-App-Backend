const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.log("Can not connect to database ", error.messege)
        process.exit(1);
    }
}

module.exports = connectDB 