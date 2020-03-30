const { saveBackgroundUserLocation } = require('./userLocationHistory.controller');

module.exports = (router) => {
    router.post('/usersLocationHistory', saveBackgroundUserLocation)
    return router;
}