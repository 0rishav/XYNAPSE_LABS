import { ZodError } from "zod";
import { sendError } from "../utils/sendError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ERROR_CODES } from "../constants/errorCode.js";

/**
 * Dynamic validation middleware
 * @param {Object} schemas - { body, query, params } each optional, Zod schemas
 */
export const validateRequest = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        return sendError(
          res,
          HTTP_STATUS?.BAD_REQUEST || 400,
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          { validationErrors: formattedErrors }
        );
      }

      next(err);
    }
  };
};
