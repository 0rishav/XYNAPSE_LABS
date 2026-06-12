import axios from "axios";
import logger from "../../../../packages/common/src/utils/logger.js";

export const verifyCourseExists = async (courseId, requestId) => {
  try {
    const response = await axios.get(
      `${process.env.COURSE_SERVICE_URL}/api/v1/internal/course/${courseId}`,
      {
        headers: {
          "x-request-id": requestId,
        },
      },
    );

    return response.data?.success === true || response.data?.exists === true;
  } catch (error) {
    logger.error(
      `[${requestId}] Error in verifyCourseExists for ID ${courseId}: ${error.message}`,
    );
    return false;
  }
};
