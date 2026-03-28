import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    language: {
      type: String,
      enum: [
        "cpp",
        "java",
        "javascript",
        "python",
        "vanillajs",
        "reactjs",
        "vuejs",
        "angularjs",
        "nodejs",
        "django",
        "springboot",
        "mysql",
        "mongodb",
        "postgresql",
      ],
      required: true,
    },

    submittedCode: {
      type: String,
      required: false,
    },

    executionResult: {
      type: String,
      enum: [
        "Passed",
        "Failed",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Memory Limit Exceeded",
        "Internal Error",
      ],
      default: "Internal Error",
    },
    submittedFiles: {
      type: [
        {
          name: { type: String, required: true },
          content: { type: String, required: true },
        },
      ],
      default: [],
      comment: "Frontend ke liye, files ka array",
    },

    customInputUsed: {
      type: String,
      default: null,
      comment: "Agar user ne khud ka input diya ho",
    },

    customOutputGenerated: {
      type: String,
      default: null,
      comment: "Us input ka output",
    },

    executionTime: {
      type: Number,
      default: 0,
    },

    memoryUsed: {
      type: Number,
      default: 0,
    },

    testCasesPassedCount: {
      type: Number,
      default: 0,
    },

    totalTestCases: {
      type: Number,
      default: 0,
    },

    detailedResults: [
      {
        testCaseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TestCase",
        },
        status: {
          type: String,
          enum: [
            "Passed",
            "Error",
            "Failed",
            "Time Limit Exceeded",
            "Runtime Error",
            "Skipped",
          ],
        },
        output: String,
        expectedOutput: String,
        executionTime: Number,
        memoryUsed: Number,
      },
    ],

    isFinal: {
      type: Boolean,
      default: true,
      comment: "In contests: true if this was last submission counted",
    },

    submissionMode: {
      type: String,
      enum: ["practice", "contest", "companyTest"],
      default: "practice",
    },

    pointsAwarded: {
      type: Number,
      default: 0,
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    customMeta: {
      type: mongoose.Schema.Types.Mixed,
      comment: "For any extra info like session ID, proctoring data etc.",
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
