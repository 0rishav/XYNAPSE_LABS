import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    input: {
      type: String,
      required: true,
    },

    expectedOutput: {
      type: String,
      required: true,
    },

    isVisible: {
      type: Boolean,
      default: false,
    },

    explanation: {
      type: String,
      default: "",
    },

    timeLimit: {
      type: Number, 
      default: null,
    },
    memoryLimit: {
      type: Number, 
      default: null,
    },

    order: {
      type: Number,
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const TestCase = mongoose.model("TestCase", testCaseSchema);
export default TestCase;
