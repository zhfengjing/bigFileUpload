/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  // console.log('appInfo', appInfo);
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1647353396818_2303';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/first_db',
      options: {},
      // mongoose global plugins, expected a function or an array of function and options
      // plugins: [createdPlugin, [updatedPlugin, pluginOptions]],
    },
  };
  config.jwt = {
    secret: 'scenery',
  };
  config.multipart = {
    mode: 'file',
    whitelist: () => true,
  };
  config.UPLOAD_DIR = path.resolve(__dirname, '..', 'app/public');
  return {
    ...config,
    ...userConfig,
  };
};
