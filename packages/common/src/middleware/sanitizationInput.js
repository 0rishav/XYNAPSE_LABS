import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

export const sanitizeRequest = (req, res, next) => {
  const sanitizeValue = (val) => {
    if (!val) return val;

    if (typeof val === "string") {
      return purify.sanitize(val);
    }

    if (Array.isArray(val)) {
      return val.map(item => sanitizeValue(item));
    }

    if (typeof val === "object") {
      const result = {};
      for (const key in val) {
        result[key] = sanitizeValue(val[key]);
      }
      return result;
    }

    return val;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);

  next();
};
