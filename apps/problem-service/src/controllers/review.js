import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import Review from "../models/reviewModal.js";
import mongoose from "mongoose";

export const createReview = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  //   console.log(userId);

  const { lab, rating, comment } = req.body;

  if (!lab) {
    return next(new ErrorHandler("Lab is required", 400));
  }

  // const existingReview = await Review.findOne({ lab, user: userId });
  // if (existingReview) {
  //   return next(new ErrorHandler("You have already reviewed this lab", 400));
  // }

  const newReview = new Review({
    lab,
    user: userId,
    rating,
    comment: comment || "",
  });

  await newReview.save();
  await newReview.populate("user", "name email");

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    review: newReview,
  });
});

export const getReviewByLab = CatchAsyncError(async (req, res, next) => {
  const { labId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(labId)) {
    return next(new ErrorHandler("No lab found", 400));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const filter = { lab: labId, isVisible: true };

  const totalReviews = await Review.countDocuments(filter);

  const avgAgg = await Review.aggregate([
    { $match: { lab: new mongoose.Types.ObjectId(labId), isVisible: true } },
    {
      $group: {
        _id: "$lab",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const averageRatingRaw = avgAgg.length > 0 ? avgAgg[0].averageRating : 0;
  const averageRating = Math.round(averageRatingRaw * 10) / 10;

  const breakdownAgg = await Review.aggregate([
    { $match: { lab: new mongoose.Types.ObjectId(labId), isVisible: true } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  breakdownAgg.forEach((entry) => {
    ratingBreakdown[entry._id] = entry.count;
  });

  const reviews = await Review.find(filter)
    .populate("user", "name image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    totalReviews,
    averageRating,
    ratingBreakdown,
    page,
    totalPages: Math.ceil(totalReviews / limit),
    reviews,
  });
});

export const updateReview = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id || "64f5b5d2c8d0fa001e5fa5e2";
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }

  const review = await Review.findById(reviewId);
  console.log(review);

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  if (!review.user.equals(userId)) {
    return next(
      new ErrorHandler("You are not authorized to update this review", 403),
    );
  }
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});

export const deleteReview = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { reviewId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }
  const review = await Review.findById(reviewId);

  if (!review.user.equals(userId)) {
    return next(
      new ErrorHandler("You are not authorized to delete this review", 403),
    );
  }
  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// helpful\

export const toggleHelpful = CatchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user?._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  const userHasMarkedHelpful = review.helpful.some((id) => id.equals(userId));
  const userHasMarkedNotHelpful = review.notHelpful.some((id) =>
    id.equals(userId),
  );

  let update = {};
  let message = "";

  if (userHasMarkedHelpful) {
    update.$pull = { helpful: userId };
    message = "Removed Helpful mark";
  } else {
    update.$addToSet = { helpful: userId };
    if (userHasMarkedNotHelpful) {
      update.$pull = { ...update.$pull, notHelpful: userId };
      message = "Changed to Helpful";
    } else {
      message = "Marked as Helpful";
    }
  }

  const updatedReview = await Review.findByIdAndUpdate(reviewId, update, {
    new: true,
  });

  res.status(200).json({
    success: true,
    message,
    helpfulCount: updatedReview.helpful.length,
    notHelpfulCount: updatedReview.notHelpful.length,
  });
});

export const toggleNotHelpful = CatchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user?._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  const userHasMarkedHelpful = review.helpful.some((id) => id.equals(userId));
  const userHasMarkedNotHelpful = review.notHelpful.some((id) =>
    id.equals(userId),
  );

  let update = {};
  let message = "";

  if (userHasMarkedNotHelpful) {
    update.$pull = { notHelpful: userId };
    message = "Removed Not Helpful mark";
  } else {
    update.$addToSet = { notHelpful: userId };
    if (userHasMarkedHelpful) {
      update.$pull = { ...update.$pull, helpful: userId };
      message = "Changed to Not Helpful";
    } else {
      message = "Marked as Not Helpful";
    }
  }

  const updatedReview = await Review.findByIdAndUpdate(reviewId, update, {
    new: true,
  });

  res.status(200).json({
    success: true,
    message,
    helpfulCount: updatedReview.helpful.length,
    notHelpfulCount: updatedReview.notHelpful.length,
  });
});

// adminPart

export const getAllReviews = CatchAsyncError(async (req, res, next) => {
  const { lab } = req.query;
  const filter = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (lab && mongoose.Types.ObjectId.isValid(lab)) {
    filter.lab = lab;
  }

  const totalReviews = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate("user", "name image email")
    .populate("lab", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    totalReviews,
    page,
    totalPages: Math.ceil(totalReviews / limit),
    reviews,
  });
});
export const deleteAdminReview = CatchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  console.log(reviewId, "review");

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }
  const review = await Review.findById(reviewId);
  console.log(review, "id");

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

export const toggleVisibility = CatchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  review.isVisible = !review.isVisible;
  await review.save();

  res.status(200).json({
    success: true,
    message: `Review visibility changed to ${review.isVisible}`,
    isVisible: review.isVisible,
  });
});
