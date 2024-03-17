const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    adminName: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        unique: true,
        required: true
    },
    adminPassword: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Admin', adminSchema);