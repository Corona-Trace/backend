const { saveUser, patchUser } = require('./user.controller');

module.exports = (router) => {
    router.post('/users', saveUser);
    router.patch('/users', patchUser)
    return router;
}