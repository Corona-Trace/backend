const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userLocationHistorySchema = new Schema({
    userId: {type: String, required: true},
    timestamp: { type: Date, required: true },
    severity: { type: Number, default: 0 },
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
    }
}, { timestamps: {} });

userLocationHistorySchema.index({ location: '2dsphere' });
userLocationHistorySchema.virtual('contactUser', {
    ref: 'user',
    localField: 'userId',
    foreignField: 'userId',
    justOne: true
});
userLocationHistorySchema.set('toObject', { virtuals: true });
userLocationHistorySchema.set('toJSON', { virtuals: true });

const UserLocationHistory = mongoose.model('userLocationHistory', userLocationHistorySchema);
module.exports = UserLocationHistory;