"use client";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: string;
  loading?: boolean;
  index?: number;
}

export default function StatCard({
  title, value, subtitle, icon: Icon,
  accentColor = "#00D4FF", loading = false, index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="glass-card glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
        >
          <Icon size={15} style={{ color: accentColor }} strokeWidth={2} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 skeleton rounded" />
          <div className="h-3 w-32 skeleton rounded" />
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </>
      )}

      {/* Accent line */}
      <div
        className="mt-4 h-px w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}30, transparent)` }}
      />
    </motion.div>
  );
}
