import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { mcqQuestionService } from "../../features/mcq/services/mcqQuestion";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Terminal,
  Award,
} from "lucide-react";
import { submissionService } from "../../features/mcq/services/mcqSubmission";

const McqQuestion = () => {
  const { paperId } = useParams();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (paperId) {
      mcqQuestionService.getQuestions({ paperId }).then((res) => {
        setQuestions(res.data.mcqs);
      });
    }
  }, [paperId]);

  const handleSelect = (qId: string, index: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: index,
    }));
  };

  const calculateScore = async () => {
    setIsSubmitting(true);

    const formattedAnswers = questions.map((q) => {
      const selectedOptionText = selectedAnswers[q._id];
      const optionIndex = q.options.findIndex(
        (o: any) => o.text === selectedOptionText,
      );

      return {
        questionId: q._id,
        selectedOptions: optionIndex !== -1 ? [optionIndex] : [],
      };
    });

    try {
      const res = await submissionService.submitMCQ({
        paperId: paperId!,
        courseId: courseId || "",
        chapterId: questions[0]?.chapterId || "",
        mode: "practice",
        answers: formattedAnswers,
      });

      setScore(res.data.totalScore);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("SUBMISSION_FAILED:", error);
      alert("Submission Failed! Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white pt-12 pb-24 px-6 md:px-0">
      <div className="max-w-3xl mx-auto">
        {/* PREMIUM HEADER */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-mono uppercase tracking-[0.3em] mb-3">
            <ShieldCheck size={12} /> Secure_Mission_Protocol
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            System_Assessment <span className="text-emerald-500">.</span>
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-2">
            COURSE_ID: {courseId || "UNKNOWN"}
          </p>
        </div>

        {/* QUESTIONS LIST */}
        <div className="space-y-8">
          {questions.map((q, idx) => {
            const isSelected = Number(selectedAnswers[q._id]);

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={q._id}
                className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] hover:border-emerald-500/20 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <p className="text-lg font-bold leading-relaxed">
                    {idx + 1}. {q.title}
                  </p>
                  <span className="text-[9px] font-mono px-2 py-1 bg-white/5 rounded-full uppercase">
                    {q.difficulty}
                  </span>
                </div>

                <div className="grid gap-3">
                  {q.options.map((opt: any, optIdx: number) => {
                    // Ab hum index compare kar rahe hain
                    const isCurrentSelected = isSelected === optIdx;
                    let borderClass = "border-white/10 bg-white/[0.02]";

                    if (submitted) {
                      if (opt.isCorrect) {
                        borderClass = "border-emerald-500 bg-emerald-500/10";
                      } else if (isCurrentSelected && !opt.isCorrect) {
                        borderClass = "border-red-500 bg-red-500/10";
                      } else {
                        borderClass = "border-white/5 opacity-50";
                      }
                    } else if (isCurrentSelected) {
                      borderClass = "border-emerald-500/50 bg-emerald-500/10";
                    }

                    return (
                      <div
                        key={`${q._id}-${optIdx}`}
                        className="flex flex-col gap-2"
                      >
                        <button
                          disabled={submitted}
                          onClick={() => handleSelect(q._id, optIdx)}
                          className={`p-4 rounded-xl border text-left transition-all font-medium text-sm ${borderClass}`}
                        >
                          {opt.text}
                        </button>

                        {submitted && opt.isCorrect && opt.explanation && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[11px] text-emerald-400/80 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mt-1"
                          >
                            <span className="font-black uppercase tracking-wider text-[9px] block mb-1 underline">
                              Correct Answer Explanation:
                            </span>
                            {opt.explanation}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-6 mt-8 pt-6 border-t border-white/5">
                  <button className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 text-[10px] uppercase font-bold tracking-widest transition-colors">
                    <ThumbsUp size={14} /> Helpful
                  </button>
                  <button className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-[10px] uppercase font-bold tracking-widest transition-colors">
                    <ThumbsDown size={14} /> Report
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* SUBMISSION FOOTER */}
        {!submitted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            onClick={() => {
              let calculatedScore = 0;
              questions.forEach((q) => {
                const selectedIdx = selectedAnswers[q._id];
                if (
                  selectedIdx !== undefined &&
                  q.options[selectedIdx]?.isCorrect
                ) {
                  calculatedScore += q.marks;
                } else if (selectedIdx !== undefined) {
                  calculatedScore -= q.negativeMarks || 0;
                }
              });

              setScore(calculatedScore);
              setSubmitted(true);
            }}
            className={`w-full mt-12 bg-emerald-500 hover:bg-emerald-400 text-black py-6 rounded-full font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(16,185,129,0.2)] transition-all ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "DEPLOING_ANSWERS..." : "DEPLOY_FINAL_ANSWER"}
            {!isSubmitting && <Terminal size={18} />}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 bg-gradient-to-br from-emerald-500/10 to-transparent p-10 rounded-[2rem] border border-emerald-500/20 text-center"
          >
            <Award size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-5xl font-black italic tracking-tighter">
              SCORE: {score}
            </h2>
            <p className="text-emerald-400/60 mt-4 font-mono uppercase tracking-[0.2em] text-xs">
              {score >= 20 ? "MISSION ACCOMPLISHED" : "TRAINING REQUIRED"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default McqQuestion;
