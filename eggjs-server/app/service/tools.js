'use strict';
const { Service } = require('egg');
const nodemailer = require('nodemailer');
const path = require('path');
const fse = require('fs-extra');
// 用户邮箱
const userEmail = 'fengjing550@163.com';
// 创建一个邮件传输端口
const transporter = nodemailer.createTransport({
  service: '163',
  secureConnection: true,
  auth: {
    user: userEmail,
    pass: 'fj@648348552',
  },
});
class ToolsService extends Service {
  async sendMail({ email, subject, html, text }) {
    const mailOptions = {
      from: userEmail,
      cc: userEmail,
      to: email,
      subject,
      html,
      text,
    };
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.log('send email error', error);
      return false;
    }
  }
  async mergeChunks(filePath, hash, size) {
    // 读取上传切片文件时的存储文件夹
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, hash);
    const chunkFiles = await fse.readdir(chunkDir);
    console.log('mergeChunks-chunkFiles', chunkFiles, path.resolve(this.config.UPLOAD_DIR, hash));
    const newchunkFiles = chunkFiles.sort((a, b) => (a.split('-')[1] - b.split('-')[1])).map(chunkFile => path.resolve(chunkDir, chunkFile));
    console.log('newchunkFiles', newchunkFiles);
    // const pipeStream=(chunkFile,writeStream)=>new Promise(resolve=>{
    //     const readStream=fse.createReadStream(chunkFile);
    //     readStream.on('end',()=>{
    //         fse.unlinkSync(chunkFile);
    //         console.log('readStream-end',fse.readdirSync(chunkDir))
    //         resolve();
    //     })
    //     readStream.pipe(writeStream);
    // })
    // await Promise.all(newchunkFiles.map((chunkFile)=>{
    //     const index=chunkFile.substr(-1);
    //     console.log('---index=',index,index*size);
    //    return pipeStream(chunkFile,fse.createWriteStream(filePath,{
    //         start:index*size,
    //         end:(index+1)*size
    //     }))
    // }))
    const chunkFilePromises = newchunkFiles.map((chunkFile, index) => {
      return new Promise(resolve => {
        const readStream = fse.createReadStream(chunkFile);
        readStream.on('end', () => {
          fse.unlinkSync(chunkFile);
          resolve();
        });
        readStream.pipe(fse.createWriteStream(filePath, {
          start: index * size,
          end: (index + 1) * size,
        }));
      });
    });
    console.log('chunkFilePromises', chunkFilePromises);
    await Promise.all(chunkFilePromises);
  }
}
module.exports = ToolsService;
