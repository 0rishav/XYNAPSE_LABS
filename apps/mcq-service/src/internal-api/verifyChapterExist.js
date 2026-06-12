import axios from "axios";

export const verifyChapterExists = async (chapterId, requestId) => {
  try {
    const response = await axios.get(
      `${process.env.COURSE_SERVICE_URL}/api/v1/internal/verify/${chapterId}`,
      { headers: { "x-request-id": requestId }, timeout: 3000 },
    );
    
    return response.data.data.exists; 
  } catch (error) {
    console.error("Course Service Verification Error:", error.message);
    return false;
  }
};
