import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Edit3,
  Send,
  Loader2,
} from "lucide-react";

import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotify } from "../../hooks/useNotify";
import type {
  IReview,
  ReviewSortType,
} from "../../features/course/types/review";
import { reviewService } from "../../features/course/services/review";
import ConfirmModal from "../../components/shared/ConfirmModal";

interface ReviewSectionProps {
  courseId: string;
}

const ReviewSection = ({ courseId }: ReviewSectionProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const { notify } = useNotify();

  // States
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState<ReviewSortType>("newest");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form States
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetReviewId, setTargetReviewId] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (isInitialLoad = false) => {
      if (isInitialLoad) setLoading(true);

      try {
        const res = await reviewService.getCourseReviews(courseId, 1, 20, sort);
        if (res.success) {
          setReviews(res.data.reviews);
        }
      } catch (err) {
        console.error("FAILED_TO_FETCH_INTEL:", err);
      } finally {
        setLoading(false);
      }
    },
    [courseId, sort],
  );

  // 2. USEEFFECT Fix
  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      fetchReviews(true);
    }

    return () => {
      isMounted = false;
    };
  }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!reviewText.trim()) return notify("Please enter review text", "ERROR");
    setSubmitting(true);

    if (editingId) {
      const res = await reviewService.updateReview(editingId, {
        rating,
        reviewText,
      });
      if (res.success) {
        notify("Review Updated successfully", "SUCCESS");
        setEditingId(null);
        fetchReviews();
      } else {
        notify(res.message, "ERROR");
      }
    } else {
      const res = await reviewService.createReview(courseId, {
        rating,
        reviewText,
      });
      if (res.success) {
        notify("Mission Intel Received! Review Submitted", "SUCCESS");
        setReviewText("");
        setRating(5);
        fetchReviews();
      } else {
        notify(res.message, "ERROR");
      }
    }
    setSubmitting(false);
  };

  const triggerDelete = (id: string) => {
    setTargetReviewId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetReviewId) return;

    setDeletingId(targetReviewId); // Spinner start
    const res = await reviewService.deleteReview(targetReviewId);

    if (res.success) {
      notify("Review Purged successfully", "SUCCESS");
      setReviews((prev) => prev.filter((r) => r._id !== targetReviewId));
    } else {
      notify(res.message, "ERROR");
    }

    setDeletingId(null);
    setIsConfirmOpen(false); // Modal close
    setTargetReviewId(null);
  };
  // 4. LIKE REVIEW (No Notify)
  const handleLike = async (id: string) => {
    const res = await reviewService.likeReview(id);
    if (res.success) {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, likesCount: res.data.likesCount } : r,
        ),
      );
    }
  };

  return (
    <div className="mt-20 border-t border-slate-100 dark:border-white/5 pt-16">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* --- LEFT: REVIEW FORM --- */}
        <div className="lg:col-span-4 w-full lg:max-w-md">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-6">
            Submit_Intel<span className="text-emerald-500">_</span>
          </h3>

          {isAuthenticated ? (
            <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star
                      size={20}
                      fill={s <= rating ? "#10b981" : "transparent"}
                      className={
                        s <= rating ? "text-emerald-500" : "text-slate-400"
                      }
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your tactical experience..."
                className="w-full h-32 bg-transparent text-sm font-mono p-0 border-none focus:ring-0 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none"
              />
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-white/5">
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setReviewText("");
                    }}
                    className="text-[10px] font-black uppercase text-red-500"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="ml-auto flex cursor-pointer items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                >
                  {submitting ? (
                    <>
                      <span className="animate-pulse">Processing_Intel...</span>
                      <Loader2 size={14} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      {editingId ? "Update_Log" : "Deploy_Review"}
                      <Send
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
              [Access_Denied]: Login to submit intel.
            </div>
          )}
        </div>

        {/* --- RIGHT: REVIEW LIST --- */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em]">
              Field_Reports ({reviews.length})
            </h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ReviewSortType)}
              className="bg-transparent border-none text-[10px] font-black uppercase text-emerald-500 focus:ring-0 cursor-pointer"
            >
              <option value="newest">Newest_First</option>
              <option value="helpful">Most_Helpful</option>
            </select>
          </div>

          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {reviews.map((rev) => (
                <motion.div
                  key={rev._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative pb-8 border-b border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10">
                        {rev.user?.image ? (
                          <img src={rev.user.image} alt="user" />
                        ) : (
                          <MessageSquare size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic">
                            {rev.user?.name || "Ghost_User"}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 uppercase">
                            • {formatDistanceToNow(new Date(rev.createdAt))} ago
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              fill={i < rev.rating ? "#10b981" : "transparent"}
                              className={
                                i < rev.rating
                                  ? "text-emerald-500"
                                  : "text-slate-200 dark:text-white/5"
                              }
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          {rev.reviewText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {rev.userId === user?._id && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingId(rev._id);
                              setReviewText(rev.reviewText);
                              setRating(rev.rating);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-2 cursor-pointer text-slate-400 hover:text-emerald-500"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => triggerDelete(rev._id)}
                            disabled={deletingId === rev._id}
                            className={`p-2 cursor-pointer transition-all ${
                              deletingId === rev._id
                                ? "text-red-500 cursor-not-allowed"
                                : "text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                            }`}
                          >
                            {deletingId === rev._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleLike(rev._id)}
                        className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black ${rev.likesCount > 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500" : "border-slate-100 dark:border-white/5 text-slate-400 hover:border-emerald-500/20"}`}
                      >
                        <ThumbsUp size={12} /> {rev.likesCount || 0}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deletingId !== null}
        title="Critical_Action_Required"
        message="Are you sure you want to permanently delete this intelligence report? This action is irreversible."
      />
    </div>
  );
};

export default ReviewSection;
