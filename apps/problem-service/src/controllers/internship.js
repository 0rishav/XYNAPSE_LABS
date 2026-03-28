import internshipRegistration from "../models/internshipModal.js";
import AdminOption from "../models/adminOptionSchema.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { sendMail } from "../../../../packages/common/src/infra/sendMail.js";

export const createInternshipRegistration = CatchAsyncError(
  async (req, res, next) => {
    const {
      firstname,
      lastname,
      email,
      mobileNumber,
      internshipField,
      availability,
      skills,
      projectDescription,
    } = req.body;

    if (!firstname || firstname.trim().length < 2) {
      return next(
        new ErrorHandler("Firstname must be at least 2 characters long", 400)
      );
    }

    if (!lastname || lastname.trim().length < 2) {
      return next(
        new ErrorHandler("Lastname must be at least 2 characters long", 400)
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return next(new ErrorHandler("Please provide a valid email", 400));
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileNumber || !mobileRegex.test(mobileNumber)) {
      return next(
        new ErrorHandler("Mobile number must be a valid 10-digit number", 400)
      );
    }

    // Check if internshipField is valid dynamically from DB
    const internshipExists = await AdminOption.findOne({
      type: "internshipField",
      value: internshipField,
      isActive: true,
    });

    if (!internshipExists) {
      return next(
        new ErrorHandler("Please select a valid Internship Field", 400)
      );
    }

    const validAvailability = ["3", "6", "9"];
    if (!availability || !validAvailability.includes(availability)) {
      return next(new ErrorHandler("Please select a valid availability", 400));
    }

    if (!skills || skills.trim().length < 10) {
      return next(
        new ErrorHandler(
          "Skills description must be at least 10 characters long",
          400
        )
      );
    }

    if (!projectDescription || projectDescription.trim().length < 20) {
      return next(
        new ErrorHandler(
          "Project description must be at least 20 characters long",
          400
        )
      );
    }

    try {
      const newProject = await internshipRegistration.create({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        internshipField,
        availability,
        skills: skills.trim(),
        projectDescription: projectDescription.trim(),
      });

      res.status(201).json({
        success: true,
        message: "Project Registered Successfully",
        project: {
          firstname: newProject.firstname,
          lastname: newProject.lastname,
          email: newProject.email,
          internshipField: newProject.internshipField,
          availability: newProject.availability,
          skills: newProject.skills,
          projectDescription: newProject.projectDescription,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllInternshipRegistrations = CatchAsyncError(
  async (req, res, next) => {
    try {
      const registrations = await internshipRegistration
        .find()
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: registrations.length,
        registrations,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteInternshipRegistration = CatchAsyncError(
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new ErrorHandler("Internship ID is required", 400));
      }

      const deletedInternship = await internshipRegistration.findByIdAndDelete(
        id
      );

      if (!deletedInternship) {
        return next(new ErrorHandler("Internship registration not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Internship registration deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// --------- Admin utilities ---------
export const getInternshipRegistrationById = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new ErrorHandler("Internship ID is required", 400));
    try {
      const doc = await internshipRegistration.findById(id);
      if (!doc)
        return next(new ErrorHandler("Internship registration not found", 404));
      return res.status(200).json({ success: true, registration: doc });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateInternshipRegistrationStatus = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'pending' | 'under_review' | 'accepted' | 'rejected'
    if (!id) return next(new ErrorHandler("Internship ID is required", 400));
    if (!status) return next(new ErrorHandler("Status is required", 400));

    try {
      const doc = await internshipRegistration.findById(id);
      if (!doc)
        return next(new ErrorHandler("Internship registration not found", 404));

      doc.status = status;
      await doc.save();

      // Optionally notify on acceptance/rejection
      if ((status === "accepted" || status === "rejected") && doc.email) {
        await sendMail({
          email: doc.email,
          subject:
            status === "accepted"
              ? "Your internship application was accepted"
              : "Your internship application was reviewed",
          template: "internship-status-updated.ejs",
          data: {
            name: `${doc.firstname} ${doc.lastname}`.trim() || "Applicant",
            status,
            internshipField: doc.internshipField,
          },
        });
      }

      return res
        .status(200)
        .json({ success: true, message: "Status updated", registration: doc });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const markInternshipRegistrationViewed = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new ErrorHandler("Internship ID is required", 400));
    try {
      const doc = await internshipRegistration.findById(id);
      if (!doc)
        return next(new ErrorHandler("Internship registration not found", 404));

      const firstTimeView = !doc.viewedAt;
      doc.viewedAt = new Date();
      if (doc.status === "pending") {
        doc.status = "under_review";
      }
      await doc.save();

      if (firstTimeView && doc.email) {
        await sendMail({
          email: doc.email,
          subject: "We've viewed your internship application",
          template: "internship-viewed.ejs",
          data: {
            name: `${doc.firstname} ${doc.lastname}`.trim() || "Applicant",
            internshipField: doc.internshipField,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Marked as viewed",
        registration: doc,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
