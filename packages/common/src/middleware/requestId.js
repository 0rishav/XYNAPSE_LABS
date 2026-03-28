import { v4 as uuidv4 } from "uuid";

export const generateRequestId = () => {
  return uuidv4();
};

export const attachRequestId = (req, res, next) => {
  const requestId = generateRequestId();
  res.locals.requestId = requestId;
  req.requestId = requestId;
  next();
};
