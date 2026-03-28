import axios from "axios";
import logger from "../../../../packages/common/src/utils/logger.js";

export const fetchUsersFromAuthService = async (userIds, requestId) => {
  try {
    if (!userIds || userIds.length === 0) return [];

    const response = await axios.post(
      `${process.env.IDENTITY_SERVICE_URL}/api/v1/auth/internal/users-batch`,
      { userIds },
      {
        headers: {
          "x-request-id": requestId,
          "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET,
        },
        timeout: 5000, 
      }
    );

    return response.data.data; 
  } catch (error) {
    logger.error(`[${requestId}] User Service Call Failed: ${error.message}`);
    return []; 
  }
};