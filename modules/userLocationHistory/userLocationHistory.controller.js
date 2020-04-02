const User = require('../user/user.model');
const UserLocationHistory = require('./userLocationHistory.model');

const { sendPush, createPayload } = require('../commonUtils');

function transformLocation(backGroundLocation){
    const {
        uuid,
        event,
        battery,
        geofence,
        odometer,
        activity,
        timestamp,
        is_moving,  
        is_heartbeat,
        extras: { userId, offset = 0 },
        coords: {
            latitude: lat,
            longitude: lng,
            speed,
            heading,
            altitude,
            accuracy,
        }
    } = backGroundLocation;
    const tz = new Date(timestamp);

    return {
        lat,
        lng,
        uuid,
        userId,
        event,
        speed,
        battery,
        heading,
        geofence,
        altitude,
        odometer,
        activity,
        accuracy,
        timestamp: new Date(tz.getTime() + offset),
        is_moving,  
        is_heartbeat,
        location: {
            type: "Point",
            coordinates: [lng, lat]
        },
    };
}

//Checks if an infected person visited the current user location previously
function checkUserLocation(userLocationHistoryObj, userObj) {
    console.log("ULH:",userLocationHistoryObj.userId);
    const { lat, lng } = userLocationHistoryObj;
    UserLocationHistory.find({
        $and: [
            { location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 100 } } },
            { timestamp: { $gte: new Date( userLocationHistoryObj.timestamp - 7 * 24 * 60 * 60 * 1000) } },
            // { timestamp: { $lte: new Date(userLocationHistoryObj.timestamp) } },
            { severity: { $eq: 1 } }
        ]
    })
    .sort({ timestamp: -1 })
    .limit(1)
    .exec(async function (err, infectedUsers) {
        if(err){
            console.error(`functionName:checkUserLocation,lat:${lat},lng:${lng}, err:${err}`);
            return null;
        }
        console.log("ULH1:",infectedUsers);
        if(infectedUsers.length > 0){
            const infectedUser = infectedUsers[0];
            try{
                const payload = await createPayload(infectedUser, userLocationHistoryObj);
                const pushObj = {
                    payload,
                    token: userObj.token
                }
                if(pushObj.token)
                    sendPush(pushObj);
            } catch (err) {
                console.log(`Error in fetching payload: ${err}`);
            }
        }      
    });
}

function saveUserLocation(tempObj) {
    const { userId } = tempObj;
    User.findOne({ userId }, function (err, userObj) {
        if (err) {
            return res.send({ message: err });
        }
        if (!userObj) {
            return res.send({ message: 'user not found' });
        }
        const userLocationHistory = new UserLocationHistory(tempObj);
        userLocationHistory.severity = userObj.severity;
        userLocationHistory.save((err, userLocationHistoryObj) => {
            if (err)
                return res.send({ message: err });
            if (userLocationHistoryObj.severity === 0)
                checkUserLocation(userLocationHistoryObj, userObj);
            return res.send({ message: 'User Location Added' });
        });
    })
}

function saveBackgroundUserLocation(req, res) {
    const { body } = req;
    if(!body.location)
        return res.status(404).send({message: 'location missing'});

    const obj = transformLocation(body.location);
    User.findOne({ userId: obj.userId }, function (err, userObj) {
        if (err) {
            return res.send({ message: err });
        }
        if (!userObj) {
            return res.send({ message: 'user not found' });
        }
        obj.severity = userObj.severity;
        const userLocationHistory = new UserLocationHistory(obj);
        userLocationHistory.save((err, userLocationHistoryObj) => {
            if (err)
                return res.send({ message: err });
            if (userLocationHistoryObj.severity === 0)
                checkUserLocation(userLocationHistoryObj, userObj);
            return res.send({ message: 'User Location Added' });
        });
    })
}

module.exports = {
    saveBackgroundUserLocation
}