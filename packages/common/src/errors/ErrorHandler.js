class ErrorHandler extends Error {
    constructor(message, statusCode,errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ErrorHandler;
