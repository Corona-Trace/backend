const { fetchNotification } = require('./notification.controller');

module.exports = (router) => {
    router.get('/notification/:userId', fetchNotification);
    return router;
}