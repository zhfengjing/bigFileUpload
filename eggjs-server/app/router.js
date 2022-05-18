'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const jwt = app.middleware.jwt({ app });
  router.get('/', controller.home.index);
  router.get('/captcha', controller.util.captcha);
  router.post('/uploadfile', controller.util.uploadfile);
  router.post('/mergeUploadFile', jwt, controller.util.mergeUploadFile);
  router.post('/checkFile', jwt, controller.util.checkFile);
  router.get('/sendEmailCode', controller.util.sendEmailCode);
  router.group({ name: 'user', prefix: '/user' }, router => {
    const { register, login, info } = controller.user;
    router.post('/register', register);
    router.post('/login', login);
    router.post('/info', jwt, info);
    // router.post('/verify', verify);
  });
};
