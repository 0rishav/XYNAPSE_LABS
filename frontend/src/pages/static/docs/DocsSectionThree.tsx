import { motion } from "framer-motion";
import {
  Trophy,
  Globe,
  Users,
  Award,
  Zap,
  Target,
  MessageSquare,
  Share2,
  TrendingUp,
  Hash,
} from "lucide-react";

const DocsSectionThree = () => {
  const rankingRules = [
    {
      title: "Lab Completion",
      points: "+50 XP",
      icon: <Target className="text-emerald-500" />,
      desc: "Successfully deploying a Docker container or passing a DSA test.",
    },
    {
      title: "Community Help",
      points: "+20 XP",
      icon: <MessageSquare className="text-blue-500" />,
      desc: "Answering queries in the discussion forum or sharing resources.",
    },
    {
      title: "Daily Streak",
      points: "+10 XP",
      icon: <Zap className="text-amber-500" />,
      desc: "Maintaining a learning streak for more than 5 days.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] tracking-[0.3em] uppercase mb-3">
            <Globe size={14} />
            GLOBAL_PROTOCOL
          </div>
          <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter mb-4">
            THE <span className="text-emerald-500 italic">XYNAPSE</span> RANKING
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
            Every line of code you push, every lab you secure, moves you up the{" "}
            <b>Global Leaderboard</b>. Build your reputation in the engineering
            elite.
          </p>
        </div>

        {/* Ranking Rules Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {rankingRules.map((rule, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] relative group overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-white dark:bg-black/40 shadow-sm text-emerald-500">
                  {rule.icon}
                </div>
                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">
                  {rule.points}
                </span>
              </div>
              <h3 className="text-lg font-black dark:text-white mb-2 uppercase italic tracking-tight">
                {rule.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                {rule.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard Preview & Network Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Leaderboard Logic */}
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Trophy size={150} className="text-white -rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold mb-4 tracking-widest uppercase">
                <Award size={14} /> Tier_System
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 uppercase">
                Rank Progression
              </h2>
              <div className="space-y-4">
                {[
                  { rank: "Titan", xp: "10,000+", color: "bg-rose-500" },
                  { rank: "Elite", xp: "5,000+", color: "bg-emerald-500" },
                  { rank: "Architect", xp: "1,000+", color: "bg-blue-500" },
                ].map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${tier.color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                      />
                      <span className="text-white font-bold uppercase text-sm tracking-widest">
                        {tier.rank}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-xs">
                      {tier.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Global Connectivity Section */}
          <div className="flex flex-col gap-6">
            <div className="p-8 rounded-[2.5rem] bg-emerald-500 group relative overflow-hidden cursor-pointer">
              <Globe
                size={100}
                className="absolute -bottom-4 -right-4 opacity-20 text-black group-hover:rotate-45 transition-transform duration-700"
              />
              <h3 className="text-black font-black text-3xl uppercase leading-none mb-4">
                Global <br /> Connectivity
              </h3>
              <p className="text-black/70 font-medium mb-6">
                Real-time status of nodes across the world. See where your peers
                are building.
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                <Share2 size={14} /> View Network
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center group">
                <TrendingUp className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-black dark:text-white">
                  2.4k
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Active_Labs
                </span>
              </div>
              <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center group">
                <Users className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-black dark:text-white">
                  12k+
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Engineers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Forum Placeholder */}
        <div className="mt-12 p-8 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
              <Hash size={24} />
            </div>
            <div>
              <h4 className="font-bold dark:text-white uppercase">
                Discussion_Protocol
              </h4>
              <p className="text-sm text-slate-500">
                Guidelines for high-quality technical peer-reviews.
              </p>
            </div>
          </div>
          <button className="px-8 py-3 bg-slate-900 text-white dark:bg-white/10 dark:text-white rounded-2xl font-bold text-sm border border-transparent hover:bg-black dark:hover:bg-white/20 dark:hover:border-white/20 transition-all shadow-lg shadow-slate-900/10 dark:shadow-none">
            READ RULES
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocsSectionThree;
