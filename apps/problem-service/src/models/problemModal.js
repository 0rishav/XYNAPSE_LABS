import mongoose from "mongoose";

const LANGUAGE_OPTIONS = {
  DSA: ["java", "javascript", "python", "cpp"],
  Frontend: ["vanillajs", "reactjs", "vuejs", "angularjs"],
  Backend: ["nodejs", "django", "spring boot"],
  Database: ["mysql", "mongodb", "postgresql"],
  Python: ["python"],
};

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["file", "directory"],
    required: true,
  },
  content: { type: String },
  isStarter: { type: Boolean, default: false },
  isExtra: { type: Boolean, default: false },
});

fileSchema.add({
  children: [fileSchema],
});

const problemSchema = new mongoose.Schema(
  {
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    labSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSection",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    inputDescription: String,
    outputDescription: String,
    constraints: String,
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],

    starterCode: {
      type: Map,
      of: String,
    },
    solutionCode: {
      type: Map,
      of: [
        {
          type: new mongoose.Schema(
            {
              title: { type: String, required: true },
              explanation: { type: String },
              code: { type: String, required: true },
              author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              createdAt: { type: Date, default: Date.now },
            },
            { _id: false }
          ),
        },
      ],
    },

    mainCodeTemplate: {
      type: Map,
      of: String,
    },
    allowedOptions: {
      type: [String],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    maxSubmissionsAllowed: {
      type: Number,
      default: 0,
    },

    hints: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        step: { type: Number },
      },
    ],

    notes: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],

    brief: {
      type: String,
      trim: true,
    },

    accessLevel: {
      type: String,
      enum: ["free", "standard", "premium"],
      default: "free",
      index: true,
    },

    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },

    showSolutionsAfterSubmission: {
      type: Boolean,
      default: false,
    },

    allowCustomTestCases: {
      type: Boolean,
      default: false,
    },
    timeLimit: {
      type: Number,
      default: 1000,
    },
    memoryLimit: {
      type: Number,
      default: 256,
    },
    testCases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestCase",
      },
    ],
    uiTestCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UITestCase",
    },

    // frontend fields

    figmaUrl: String,
    referenceImages: [String],
    expectedUIComponents: [String],
    viewportWidth: Number,
    viewportHeight: Number,

    starterProjectStructure: {
      type: fileSchema,
    },

    starterFilesVisible: {
      type: Map,
      of: [String],
      default: {},
    },

    // backend fields

    apiSpecs: [
      {
        method: {
          type: String,
          enum: ["GET", "POST", "PUT", "DELETE"],
        },
        endpoint: String,
        requestExample: mongoose.Schema.Types.Mixed,
        responseExample: mongoose.Schema.Types.Mixed,
        description: String,
        authRequired: {
          type: Boolean,
          default: false,
        },
      },
    ],
    environmentVariables: [String],
    databaseSchemaDescription: String,

    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

problemSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

problemSchema.pre("save", async function (next) {
  if (this.isModified("lab") || this.isNew) {
    await this.populate("lab");

    const labType = this.lab.labType;

    if (labType && LANGUAGE_OPTIONS[labType]) {
      this.allowedOptions = LANGUAGE_OPTIONS[labType];
    } else {
      this.allowedOptions = [];
    }
  }

  next();
});

fileSchema.pre("validate", function (next) {
  if (this.type === "file" && !this.content) {
    return next(new Error("File must have content"));
  }
  if (
    this.type === "directory" &&
    (!this.children || this.children.length === 0)
  ) {
    return next(new Error("Directory must have children"));
  }
  next();
});

const Problem = mongoose.model("Problem", problemSchema);
export default Problem;
