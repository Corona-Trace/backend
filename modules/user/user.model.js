const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: {type: String, required: true, unique: true},
    severity: { type: Number, default: 0 },
    token: String,
}, { timestamps: {} });

const User = mongoose.model('user', userSchema);
module.exports = User;