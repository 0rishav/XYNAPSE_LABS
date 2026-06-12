import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config/index.js";
import { logProxyRequest, logProxyResponse } from "./logger.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

const proxyOptions = {
  changeOrigin: true,
  preserveHeaderKeyCase: true,
  onProxyReq: (proxyReq, req, res) => {
    logProxyRequest(proxyReq, req, res);

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logProxyResponse(proxyRes, req, res);
  },
  onError: (err, req, res) => {
    const error = new ErrorHandler(
      "Service temporarily unavailable",
      503,
      "SERVICE_UNAVAILABLE"
    );
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.errorCode
    });
  },
};

export const identityProxy = createProxyMiddleware({
  ...proxyOptions,
  target: config.services.identity, 
  pathRewrite: (path, req) => {
    return `/api/v1/auth${path}`;
  },
});

export const courseProxy = createProxyMiddleware({
    ...proxyOptions,
    target: config.services.course,
    pathRewrite: (path, req) => {
    return req.originalUrl; 
  },
});

export const mcqProxy = createProxyMiddleware({
  ...proxyOptions,
  target: config.services.mcq,
  pathRewrite: (path, req) => {
    return req.originalUrl;
  },
});