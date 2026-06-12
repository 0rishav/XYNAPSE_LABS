import api from "../../../api/api";
import type {
  ISubmissionPayload,
  ISubmissionResponse,
} from "../types/mcqSubmission";

export const submissionService = {
  submitMCQ: async (
    payload: ISubmissionPayload,
  ): Promise<ISubmissionResponse> => {
    try {
      const response = await api.post<ISubmissionResponse>(
        "/mcqSubmission/create",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("SERVICE_ERROR: Submission failed", error);
      throw error;
    }
  },
};
