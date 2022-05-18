const express = require("express");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
// 配置运行端口
const port = process.env.PORT || 3000;
// 判断是否为开发环境
const dev = process.env.NODE_ENV !== "production";
// 初始化app
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("app=", app);
// 代理配置表，这里和一般的webpack是一样的
const proxyable = {
  "/api": {
    target: "http://localhost:7001",
    pathRewrite: {
      "^/api": "",
    },
    changeOrigin: true,
  },
  "/public": {
    target: "http://localhost:7001",
    changeOrigin: true,
  },
};

app
  .prepare()
  .then(() => {
    const server = express();
    // 如果是开发环境，则代理借口
    if (dev) {
      server.use("/api", createProxyMiddleware(proxyable["/api"]));
      server.use("/public", createProxyMiddleware(proxyable["/public"]));
    }
    // 托管所有请求
    server.all("*", (req, res) => {
        console.log('server-req=',req.url,req.url.includes('/api'));
        if(req.url.includes('/api')){
            console.log('server-req=',req.url,req);
        }
     return handle(req, res);
    });
    // 监听端口
    server.listen(port, (err) => {
      if (err) {
        throw err;
      }
      console.log("next-front is on running on http://localhost:" + port);
    });
  })
  .catch((err) => {
    console.log("Error::::", err);
  });
