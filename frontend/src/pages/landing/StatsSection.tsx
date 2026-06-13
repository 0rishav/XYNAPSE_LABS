import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Users, Code2, Terminal, Globe2, Activity } from "lucide-react";

// Counter Component for smooth increment
const Counter = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  const displayText = useTransform(springValue, (latest) =>
    Math.floor(latest).toLocaleString(),
  );

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return (
    <span ref={ref} className="font-black tabular-nums">
      {/* motion.span ke children mein ab hum MotionValue pass kar sakte hain */}
      <motion.span>{displayText}</motion.span>
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  const stats = [
    {
      id: "problems",
      label: "Practical_Problems",
      value: 1250,
      suffix: "+",
      icon: <Code2 size={20} />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      id: "engineers",
      label: "Engineers_Enrolled",
      value: 540,
      suffix: "+",
      icon: <Users size={20} />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      id: "deployments",
      label: "Lab_Deployments",
      value: 8900,
      suffix: "k",
      icon: <Terminal size={20} />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      id: "uptime",
      label: "Network_Uptime",
      value: 99,
      suffix: ".9%",
      icon: <Activity size={20} />,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-[#05070a] border-y border-slate-100 dark:border-white/5 relative overflow-hidden transition-colors">
      {/* Background Decorative Element */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              {/* Icon & Label */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}
                >
                  {stat.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono">
                  {stat.label}
                </span>
              </div>

              {/* Counter Value */}
              <div className="text-4xl md:text-5xl mt-10 font-black text-slate-900 dark:text-white tracking-tighter">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>

              {/* Sub-label for context */}
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                Verified on Upcoding Mainnet
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Side "Live" Badge */}
      <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
        <Globe2
          size={40}
          className="text-slate-400 dark:text-white animate-spin-slow"
        />
        <span className="[writing-mode:vertical-rl] text-[8px] font-bold tracking-[0.5em] text-slate-400 dark:text-white uppercase">
          Global_Connectivity
        </span>
      </div>
    </section>
  );
};

export default StatsSection;
