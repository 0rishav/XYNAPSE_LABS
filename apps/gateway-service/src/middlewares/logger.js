import morgan from "morgan";
import logger from "../../../../packages/common/src/utils/logger.js";

const getServiceName = (url) => {
  if (!url) return "gateway-service";
  const parts = url.split("/");
  return parts[3] ? `${parts[3]}-service` : "gateway-service";
};

const stream = {
  write: (message) => {
    const parts = message.trim().split(" ");
    const url = parts[2] || ""; 
    const serviceName = getServiceName(url);

    logger.info(message.trim(), { service: serviceName });
  },
};

const skip = (req, res) => {
  const env = process.env.NODE_ENV || "development";
  return env === "production" && res.statusCode < 400;
};


export const httpLogger = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  {
    stream,
    skip,
  }
);

export const logProxyRequest = (proxyReq, req, res) => {
  const serviceName = getServiceName(req.originalUrl);

  logger.info(
    `[ProxyRequest] Routing ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
    { service: serviceName }
  );
};

export const logProxyResponse = (proxyRes, req, res) => {
  const serviceName = getServiceName(req.originalUrl);

  logger.info(
    `[ProxyResponse] Received ${proxyRes.statusCode} from ${req.url}`,
    { service: serviceName }
  );
};