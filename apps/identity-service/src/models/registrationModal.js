import mongoose from "mongoose";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

const projectRegistrationSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, "Please enter your first name"],
    trim: true,
    minlength: [2, "First name must be at least 2 characters long"],
    maxlength: [50, "First name cannot exceed 50 characters"],
  },
  lastname: {
    type: String,
    required: [true, "Please enter your last name"],
    trim: true,
    minlength: [2, "Last name must be at least 2 characters long"],
    maxlength: [50, "Last name cannot exceed 50 characters"],
  },
  mobileNumber: {
    type: String,
    required: [true, "Please enter your mobile number"],
    validate: {
      validator: function(v) {
        return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: "Please enter a valid mobile number",
    },
  },
  collegeName: {
    type: String,
    required: [true, "Please enter your college name"],
    trim: true,
    minlength: [3, "College name must be at least 3 characters long"],
    maxlength: [100, "College name cannot exceed 100 characters"],
  },
  degree: {
    type: String,
    enum: {
      values: ["BE", "B.tech", "M.tech", "MCA", "BCA", "B.sc", "M.sc", "Ph.D"],
      message: "Please select a valid degree option",
    },
    required: [true, "Please select your degree"],
  },
  semester: {
    type: String,
    enum: {
      values: [
        "1st semester",
        "2nd semester",
        "3rd semester",
        "4th semester",
        "5th semester",
        "6th semester",
        "7th semester",
        "8th semester",
      ],
      message: "Please select a valid semester",
    },
    required: [true, "Please select your semester"],
  },
  projectName: {
    type: String,
    required: [true, "Please enter the project name"],
    trim: true,
    minlength: [5, "Project name must be at least 5 characters long"],
    maxlength: [100, "Project name cannot exceed 100 characters"],
  },
  projectDescription: {
    type: String,
    required: [true, "Please provide a description of your project"],
    minlength: [20, "Project description must be at least 20 characters long"],
    maxlength: [1000, "Project description cannot exceed 1000 characters"],
  },
  dateGiven: {
    type: Date,
    required: [true, "Please provide the date when the project was given"],
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v.valueOf());
      },
      message: "Please provide a valid date",
    },
  },
  deadline: {
    type: Date,
    required: [true, "Please provide the project deadline"],
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v.valueOf());
      },
      message: "Please provide a valid deadline date",
    },
  },
  queries: {
    type: String,
    trim: true,
    maxlength: [500, "Queries cannot exceed 500 characters"],
  },
  status: {
    type: String,
    enum: ["Initiated", "In Progress", "Review", "Completed", "Delivered"],
    default: "Initiated",
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: [0, "Completion percentage cannot be less than 0"],
    max: [100, "Completion percentage cannot exceed 100"],
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ["Initiated", "In Progress", "Review", "Completed", "Delivered"],
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true, 
});

projectRegistrationSchema.pre('save', function(next) {
  if (this.deadline <= this.dateGiven) {
    return next(new ErrorHandler('Deadline must be after the date given',400));
  }
  next();
});

const ProjectRegistration = mongoose.model("ProjectRegistration", projectRegistrationSchema);

export default ProjectRegistration;
