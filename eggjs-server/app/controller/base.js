'use strict';
// 定制规范
const Controller = require('egg').Controller;

class BaseController extends Controller {
  success(data) {
    this.ctx.body = {
      code: 0,
      data,
    };
  }
  message(message, code = 0) {
    this.ctx.body = {
      code,
      message,
    };
  }
  error(message, code = -1, errors = {}) {
    this.ctx.body = {
      message,
      code,
      errors,
    };
  }

}

module.exports = BaseController;
