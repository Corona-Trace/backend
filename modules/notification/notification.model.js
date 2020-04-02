const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: {type: String, required: true},
    address: String,
    lat: Number,
    lng: Number,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    timestamp: { type: Date, required: true },
}, { timestamps: {} });

notificationSchema.index({ location: '2dsphere' });
const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;