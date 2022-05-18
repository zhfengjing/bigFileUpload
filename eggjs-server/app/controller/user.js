'use strict';
const BaseController = require('./base');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
// 加盐法存储密码
const HartSalt = 'scenery';
class UserController extends BaseController {
  constructor(context) {
    super(context);
    this.createRule = {
      email: { type: 'email' },
      username: { type: 'string' },
      password: { type: 'string' },
      confirmPassword: { type: 'string' },
      verificationCode: { type: 'string' },
    };
  }
  async login() {
    const { ctx, app } = this;
    console.log('login-req', ctx.request.body, ctx.request.header);
    console.log('login-session', ctx.session.captcha, ctx.session);
    const { email, username, password } = ctx.request.body;
    // const cookie = ctx.cookies.get('session', {
    //   httpOnly: false,
    //   signed: false,
    //   encrypt: true, // 加密传输
    // });
    // console.log('login-cookie', cookie, ctx.cookies);
    // 从ctx.session中获取存储的captcha,与客户端传来的验证码比对是否相等
    // const sessionEmailCode = ctx.session.emailCode;
    // if(emailCode.toUpperCase()!==sessionEmailCode.toUpperCase()){
    //   return this.error('邮箱验证码错误', -1, {});
    // }
    // 查询数据库是否存在此邮箱
    const user = await ctx.model.User.findOne({ email, password: md5(password + HartSalt) });
    console.log('login-user', user);
    if (!user) {
      return this.error('用户名密码错误');
    }
    // 生成token,给到前端
    const token = jwt.sign({ email, username, id: user._id }, app.config.jwt.secret, {
      expiresIn: '1h',
    });
    console.log('token', token);
    this.success({ token });
  }
  async register() {
    const { ctx } = this;
    console.log('register-req', ctx.request.body);
    console.log('register-session', ctx.session.captcha, ctx.session);
    try {
      // 校验参数类型
      ctx.validate(this.createRule);
    } catch (error) {
      this.error('参数校验失败', -1, error);
    }
    const { email, username, password, verificationCode } = ctx.request.body;
    // 从ctx.session中获取存储的captcha,与客户端传来的验证码比对是否相等
    const sessionCaptcha = ctx.session.captcha;
    if (verificationCode.toUpperCase() !== sessionCaptcha.toUpperCase()) {
      return this.error('验证码错误', -1, {});
    }
    // 验证邮箱是否已存库
    const res = await this.checkEmail(email);
    console.log('res=', res);
    if (res) {
      return this.error('该邮箱已注册', -1, {});
    }
    //  进行入库操作
    const user = await ctx.model.User.create({
      email,
      username,
      password: md5(password + HartSalt),
    });
    console.log('register-User.create-user', user);
    user._id && this.message('注册成功', 0);
    // set-cookie to client
    // ctx.cookies.set('session', `username=${username}&password=${password}&verificationCode=${verificationCode}`, {
    //   httpOnly: false,
    //   signed: false,
    //   encrypt: true, // 加密传输
    // });
  }
  async checkEmail(email) {
    // 从数据库里查看是否已包含该邮箱
    const user = await this.ctx.model.User.findOne({ email });
    return user;
  }
  async info() {
    const { ctx } = this;
    const { email } = ctx.state;
    const user = await this.checkEmail(email);
    console.log('info-user', user);
    if (!user) {
      this.error('user info error');
    }
    return this.success(user);
  }
  // async verify() {}
}

module.exports = UserController;
