'use strict';
const fse = require('fs-extra');
const path = require('path');
const svgCaptcha = require('svg-captcha');
const BaseController = require('./base');

class Utilontroller extends BaseController {
  // 注册时的图形验证码
  async captcha() {
    const { ctx } = this;
    const captcha = svgCaptcha.create({

    });
    // console.log('captcha.text=', captcha.text);
    // ctx.response.type='application/json';
    ctx.response.type = 'image/svg+xml';
    ctx.session.captcha = captcha.text;
    ctx.body = captcha.data;
  }
  // 邮箱验证码
  async sendEmailCode() {
    const { ctx } = this;
    const email = ctx.query.email;
    // console.log('sendEmailCode',email);
    // 生成一个随机验证码，并将验证码存放于session中
    const code = Math.random().toString().slice(2, 6);
    ctx.session.emailCode = code;
    // 设置发送邮件的一些字段
    const subject = 'scenery dev email code';
    const text = '';
    const html = `<p>验证码：<a href='http://localhost:3000/'>${code}</a></p>`;
    const hasSend = await this.service.tools.sendMail({ email, subject, html, text });
    if (hasSend) {
      return this.success('发送成功');
    }
    this.error('发送失败');
  }
  async uploadfile() {
    const { ctx } = this;
    // console.log('uploadfile',ctx.request.body,ctx.request.files);
    // 模拟上传失败的情况
    if (Math.random() > 0.3) {
      ctx.status = 500;
      return;
    }
    // 前端分片上传，后端以hash方式保存分片的数据
    const { name, hash } = ctx.request.body;
    const file = ctx.request.files[0];
    // const filepath=file.filepath;
    const chunkHash = path.resolve(this.config.UPLOAD_DIR, hash);
    // console.log('chunkHash',chunkHash);
    if (!fse.existsSync(chunkHash)) {
      await fse.mkdir(chunkHash);
      // console.log('fse.mkdir(chunkHash)',fse.mkdir(chunkHash));
    }
    await fse.move(file.filepath, `${chunkHash}/${name}`);
    this.message('切片上传成功');

    // 最初始化的上传文件保存的方式
    // const file=ctx.request.files[0];
    // const filename=file.filename;
    // const filepath=file.filepath;
    // fse.move(filepath,this.config.UPLOAD_DIR+'/'+filename);
    // this.success({
    //   url:'/public/'+file.filename
    // })
  }
  // 合并上传的文件
  async mergeUploadFile() {
    const { ctx } = this;
    const { hash, ext, size } = ctx.request.body;
    // 文件合并最终的存储位置
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`);
    // console.log('mergeUploadFile', filePath);
    await ctx.service.tools.mergeChunks(filePath, hash, size);
    const { email } = ctx.state;
    console.log('mergeUploadFile', ctx.state);
    await ctx.model.User.updateOne({ email }, { $set: { avatar: `/public/${hash}.${ext}` } });
    this.success({
      url: `/public/${hash}.${ext}`,
    });
  }
  async checkFile() {
    const { ctx } = this;
    const { hash, ext } = ctx.request.body;
    let uploaded = false;
    let uploadedList = [];
    // 获取文件路径，并查看是否存在此文件，如果存在，则返回uploaded=true并把uploadedList给到前端，如果不存在则告诉前端uploaded=false，并看下是否存在已上传到文件碎片，如果存在，则返回给前端
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`);
    //  获取文件切片文件夹
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash);
    // console.log('chunkPath=', chunkPath, fse.existsSync(chunkPath));
    if (fse.existsSync(filePath)) {
      uploaded = true;
      const { email } = ctx.state;
      console.log('checkFile', ctx.state);
      await ctx.model.User.updateOne({ email }, { $set: { avatar: `/public/${hash}.${ext}` } });
      this.success({
        url: '/public/' + hash + '.' + ext,
        uploaded,
        // uploadedList
      });
    } else {
      uploaded = false;
      uploadedList = fse.existsSync(chunkPath) ? fse.readdirSync(chunkPath) : [];
      console.log('-----', uploadedList);
      this.success({
        uploaded,
        uploadedList,
      });
    }
  }

}

module.exports = Utilontroller;
