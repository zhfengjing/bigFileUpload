'use strict';

const jwt = require('jsonwebtoken');

module.exports = ({ app }) => async function verifyToken(ctx, next) {
  // 从header中取出authorzation,如果authorzation存在则解析出token，如果authorzation不存在，则返回‘用户未登录’的提示信息
  const authorzation = ctx.request.header.authorzation;
  if (!authorzation) {
    ctx.body = {
      code: -2,
      message: '用户未登录',
    };
    return;
  }
  const token = authorzation.replace('Bearer ', '');
  try {
    // 使用jwt校验token是否有效
    const ret = await jwt.verify(token, app.config.jwt.secret);
    ctx.state.email = ret.email;
    ctx.state.id = ret.id;
    console.log('ret', ret);
    await next();
  } catch (error) {
    console.log('jwt-verify-error', error);
    if (error.name === 'TokenExpiredError') {
      ctx.body = {
        code: -2,
        message: '登录过期了',
      };
      return;
    }
    ctx.body = {
      code: -1,
      message: '用户信息报错',
    };
  }

};
