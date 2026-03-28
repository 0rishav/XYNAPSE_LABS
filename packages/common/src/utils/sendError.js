export const sendError = (res, statusCode, message, code) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || null,
    },
  });
};
