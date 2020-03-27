const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: {type: String, required: true},
    address: String,
    lat: Number,
    lng: Number,
    timestamp: { type: Date, required: true },
}, { timestamps: {} });

const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;