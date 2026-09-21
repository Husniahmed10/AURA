"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calendar,
  BarChart2,
  TrendingUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/lib/api";
import RiskGauge from "@/components/ui/RiskGauge";
import VulnerabilityTable from "@/components/ui/VulnerabilityTable";
import type { SecurityReport } from "@/types/api";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: report,
    isLoading,
    error,
  } = useQuery<SecurityReport>({
    queryKey: ["report", id],
    queryFn: () => api.getReport(id),
    retry: 1,
  });

  if (isLoading)
    return (
      <div className="space-y-6 max-w-4xl">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton rounded-xl"
            style={{ height: i === 0 ? 96 : 160 }}
          />
        ))}
      </div>
    );

  if (error || !report)
    return (
      <div className="glass-card p-8 text-center max-w-md mx-auto mt-10">
        <AlertTriangle
          size={32}
          style={{ color: "#FFB800", margin: "0 auto 12px" }}
        />
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Report not available
        </p>
        <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
          The scan may not be completed yet.
        </p>
        <Link href={"/scans/" + id} className="btn-secondary">
          Back to Scan Monitor
        </Link>
      </div>
    );

  const successRate = report.success_rate.toFixed(1);
  const critCount = report.vulnerabilities.filter(
    (v) => v.severity === "critical",
  ).length;
  const highCount = report.vulnerabilities.filter(
    (v) => v.severity === "high",
  ).length;

  return (
    <div className="page-stack">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="report-heading"
      >
        <div>
          <div className="eyebrow">EVIDENCE & INSIGHTS</div>
          <h1
            className="text-2xl font-medium tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Security assessment report
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <Target size={12} style={{ color: "var(--text-muted)" }} />
              <span
                className="text-xs mono break-all"
                style={{ color: "var(--text-secondary)" }}
              >
                {report.target_url}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} style={{ color: "var(--text-muted)" }} />
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {format(new Date(report.scan_date), "PPP")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={"/scans/" + id}
            className="btn-secondary"
            style={{ padding: "7px 14px", fontSize: "12px" }}
          >
            Back to Monitor
          </Link>
          <a
            href={api.getPdfUrl(id)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <Download size={14} />
            Download PDF
          </a>
        </div>
      </motion.div>

      <div className="report-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card flex flex-col items-center justify-center py-6"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Overall Risk Score
          </p>
          <RiskGauge score={report.overall_risk_score} size={160} />
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          <ReportMetric
            label="Total Attacks"
            value={String(report.total_attacks)}
            icon={BarChart2}
            color="#00D4FF"
            index={0}
          />
          <ReportMetric
            label="Successful Attacks"
            value={String(report.successful_attacks)}
            icon={TrendingUp}
            color="#FF2D55"
            index={1}
          />
          <ReportMetric
            label="Success Rate"
            value={successRate + "%"}
            icon={AlertTriangle}
            color="#FFB800"
            index={2}
          />
          <ReportMetric
            label="Vulnerabilities"
            value={String(report.vulnerabilities.length)}
            sub={critCount + " critical, " + highCount + " high"}
            icon={FileText}
            color="#FF6B35"
            index={3}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText size={14} style={{ color: "var(--text-muted)" }} />
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}
          >
            Executive Summary
          </h2>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {report.executive_summary}
        </p>
        {report.recommendations?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Recommendations
            </p>
            {report.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2
                  size={13}
                  style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rec}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <div
          className="flex items-center justify-between pb-4 mb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--text-primary)" }}
            >
              Vulnerability Findings
            </h2>
            <span className="badge badge-failed">
              {report.vulnerabilities.length} found
            </span>
          </div>
          {critCount > 0 && (
            <span className="badge badge-critical">{critCount} Critical</span>
          )}
        </div>
        <VulnerabilityTable findings={report.vulnerabilities} />
      </motion.div>
    </div>
  );
}

function ReportMetric({
  label,
  value,
  sub,
  icon: Icon,
  color,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="glass-card p-4 space-y-1"
    >
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color }} />
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}
