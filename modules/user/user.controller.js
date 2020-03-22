const User = require('./user.model');
const UserLocationHistory = require('../userLocationHistory/userLocationHistory.model');

const { sendPush, createPayload } = require('../commonUtils');

const saveUser = (req, res) => {
    const { userId } = req.body;
    console.log(`received userId:${userId}`);
    if (!userId)
        return res.status(400).send({ message: 'User Id missing' });
    User.findOneAndUpdate({ userId }, { ...req.body }, { upsert: true }, (err) => {
        if (err)
            return res.send({ message: err });
        return res.send({ message: 'User Added or Updated' });
    });
}

const patchUser = (req, res) => {
    const { userId, severity } = req.body;
    User.findOneAndUpdate({ userId: userId }, { severity: severity }, function (err) {
        if (err)
            return res.send({ message: err });
        else {
            UserLocationHistory.updateMany({ userId: userId }, { severity: severity }, function (err) {
                if (err)
                    return res.send({ message: err });
                if (severity === 1)
                    checkUserHistory(userId)
                return res.send({ message: 'updated' });
            });
        }
    });
}

//Notify users if they visited places visited by infected person, based on userLocation.
function checkUserHistory(userId) {
    console.log("CheckUserHistory: ", userId);
    UserLocationHistory.find({
        $and: [
            { userId: userId },
            { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
    }).exec(function (err, infectedUserHistories) {
        if (err) {
            console.log(`checkUserHistory: ${err}`);
            return null;
        }
        console.log('CheckUserHistory:infectedUserHistories', infectedUserHistories);
        infectedUserHistories.forEach((infectedUserHistoryObj) => {
            const { lat, lng } = infectedUserHistoryObj;
            UserLocationHistory.find({
                $and: [
                    { location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 3 } } },
                    { timestamp: { $gte: new Date(infectedUserHistoryObj.timestamp) } },
                    { severity: { $eq: 0 } }
                ]
            })
                .sort({ timestamp: 1 })
                .populate('contactUser')
                .exec(async function (err, users) {
                    console.log("CheckUserHistory:", users);
                    if (err) {
                        console.log(`checkUserHistory: ${err}`);
                        return null;
                    }
                    // Below lines are to remove duplicate userLocationHistory for same location
                    const usersObj = {};
                    users.forEach((user) => {
                        usersObj[user.userId] = user;
                    });
                    for (let userKey in usersObj) {
                        const user = usersObj[userKey];
                        console.log("CheckUserHistory", user);
                        try {
                            const message = await createPayload(infectedUserHistoryObj, user);
                            const payload = {
                                notification: {
                                    title: `Alert: You crossed paths with someone confirmed Positive.`,
                                    body: message,
                                    badge: '1',
                                    sound: 'default'
                                }
                            };
                            const pushObj = {
                                payload,
                                token: user.contactUser.token
                            }
                            console.log("CheckUserHistory", pushObj);
                            if (pushObj.token)
                                sendPush(pushObj);
                        } catch (err) {
                            console.log(`Error in fetching payload`);
                        }
                    }
                })
        })

    })
}

module.exports = {
    saveUser,
    patchUser
}