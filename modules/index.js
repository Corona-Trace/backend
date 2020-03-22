const express =  require('express');

const router = express.Router();
const user = require('./user/user.routes')(router);
const userLocationHistory = require('./userLocationHistory/userLocationHistory.routes')(router);

router.use(user);
router.use(userLocationHistory);

module.exports =  router;