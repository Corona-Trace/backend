const Notification = require('./notification.model');

function fetchNotification(req, res){
    const { userId } = req.params;
    let { page = 1, perPage = 10 } = req.query
    page = parseInt(page);
    perPage = parseInt(perPage);

    Notification.find({ userId })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
        .exec((err, notifications) => {
            if (err)
                return res.send({ message: err });
            return res.send({ data: notifications });
        });

}

function saveNotification(notificationObj){
    const notification = new Notification(notificationObj);
    return notification.save();
}

module.exports = {
    saveNotification,
    fetchNotification
}