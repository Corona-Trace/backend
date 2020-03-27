const express =  require('express');

const router = express.Router();
const user = require('./user/user.routes')(router);
const notification = require('./notification/notification.route')(router);
const userLocationHistory = require('./userLocationHistory/userLocationHistory.routes')(router);

router.use(user);
router.use(notification);
router.use(userLocationHistory);

module.exports =  router;