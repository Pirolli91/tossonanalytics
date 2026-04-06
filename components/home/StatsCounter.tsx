"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  label: string;
  value: number;
  suffix: string;
  description: string;
}

const STATS: Stat[] = [
  {
    label: "NC Counties",
    value: 100,
    suffix: "",
    description: "Monitored across the state",
  },
  {
    label: "PFAS Compounds",
    value: 29,
    suffix: "",
    description: "Tracked per EPA UCMR 5",
  },
  {
    label: "Residents Affected",
    value: 500,
    suffix: "K+",
    description: "Cape Fear Basin alone",
  },
  {
    label: "EPA MCL",
    value: 4,
    suffix: " ppt",
    description: "Legal limit for PFOA & PFOS",
  },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
        >
          <p className="text-2xl font-bold text-[var(--brand-accent)]">
            <Counter target={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-1 text-sm font-semibold text-white/90">
            {stat.label}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{stat.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
