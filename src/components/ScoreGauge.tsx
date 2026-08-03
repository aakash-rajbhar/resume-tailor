"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const R = 80;
const CX = 100;
const CY = 100;
const CIRC = Math.PI * R;

function angleForScore(score: number) {
  return 180 - (Math.max(0, Math.min(100, score)) / 100) * 180;
}

function pointOnArc(score: number) {
  const angle = (angleForScore(score) * Math.PI) / 180;
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

function scoreColor(score: number) {
  return score >= 80 ? "var(--green)" : score >= 60 ? "var(--amber)" : "var(--red)";
}

export default function ScoreGauge({ before, after }: { before: number; after: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const delta = after - before;
  const color = scoreColor(after);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200;
    const end = after;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.round(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [after]);

  const afterFrac = Math.max(0, Math.min(100, after)) / 100;
  const beforePoint = pointOnArc(before);
  const tickRotation = 90 - angleForScore(before);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center bg-[var(--surface)] p-6 rounded-xl border border-[var(--line)] shadow-inner relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-br from-[var(--surface-2)]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-dotgrid opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-60">
        <svg viewBox="0 0 200 112" className="w-full">
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="var(--line)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.6"
          />
          <motion.path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC * (1 - afterFrac) }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.line
            x1={beforePoint.x}
            y1={beforePoint.y - 9}
            x2={beforePoint.x}
            y2={beforePoint.y + 9}
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            transform={`rotate(${tickRotation} ${beforePoint.x} ${beforePoint.y})`}
          />
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            className="font-mono"
            fontSize="32"
            fill="var(--ink)"
            fontWeight="800"
          >
            {displayScore}
          </text>
          <text
            x={CX}
            y={CY + 14}
            textAnchor="middle"
            className="font-mono tracking-widest"
            fontSize="9"
            fill="var(--ink)"
            opacity="0.5"
          >
            ATS MATCH %
          </text>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-4 text-center z-10"
      >
        <p className="overline opacity-60 mb-1.5">Optimization Report</p>
        <p className="font-mono text-sm font-semibold flex items-center justify-center gap-1.5">
          <span className="opacity-40">{before}%</span>
          <span className="opacity-30">→</span>
          <span style={{ color }}>{after}%</span>
          <span
            className="text-[12px] px-1.5 py-0.5 rounded ml-1 font-bold"
            style={{
              background: delta >= 0 ? "var(--green-soft)" : "var(--red-soft)",
              color: delta >= 0 ? "var(--green)" : "var(--red)",
            }}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}
