const User = require('../user/user.model');
const UserLocationHistory = require('./userLocationHistory.model');

const { sendPush, createPayload } = require('../commonUtils');

//Checks if an infected person visited the current user location previously
function checkUserLocation(userLocationHistoryObj, userObj) {
    console.log("ULH:",userLocationHistoryObj.userId);
    const { lat, lng } = userLocationHistoryObj;
    UserLocationHistory.find({
        $and: [
            { location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 3 } } },
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
            } catch(err){
                console.log(`Error in fetching payload: ${err}`);
            }
        }      
    });
}

function saveUserLocation(req, res) {
    const { userId } = req.body;
    User.findOne({ userId }, function (err, userObj) {
        if (err) {
            return res.send({ message: err });
        }
        if (!userObj) {
            return res.send({ message: 'user not found' });
        }
        const userLocationHistory = new UserLocationHistory(req.body);
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

module.exports = {
    saveUserLocation
}