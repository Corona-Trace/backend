const { saveUserLocation } = require('./userLocationHistory.controller');

module.exports = (router) => {
    router.post('/usersLocationHistory', saveUserLocation);
    return router;
}