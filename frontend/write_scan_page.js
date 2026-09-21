const fs = require("fs");
const path = require("path");

const scanPage = `"use client";
import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Ban, FileBarChart2, RefreshCw, Target, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import ScanTimeline from "@/components/ui/ScanTimeline";
import type { ScanStatusResponse } from "@/types/api";

const TERMINAL = new Set(["completed","failed","aborted"]);

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: scan, isLoading, error } = useQuery<ScanStatusResponse>({
    queryKey: ["scan", id],
    queryFn: () => api.getScan(id),
    refetchInterval: (query: any) =>
      TERMINAL.has(query.state.data?.status ?? "") ? false : 3000,
  });

  const abort = useMutation({
    mutationFn: () => api.abortScan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scan", id] }),
  });

  const isActive = scan && !TERMINAL.has(scan.status);
  const progress = scan ? Math.round((scan.attacks_completed / (scan.max_attacks || 1)) * 100) : 0;

  if (isLoading) return <LoadingSkeleton />;

  if (error || !scan) return (
    <div className="glass-card p-8 text-center max-w-md mx-auto mt-10">
      <AlertTriangle size={32} style={{ color: "#FFB800", margin: "0 auto 12px" }} />
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Scan not found</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>ID: {id}</p>
      <Link href="/" className="btn-secondary mt-4 inline-flex">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-black mono" style={{ color: "var(--text-primary)" }}>{id}</h1>
            <StatusBadge status={scan.status} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Started {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scan.status === "completed" && (
            <Link href={"/scans/" + id + "/report"} className="btn-primary">
              <FileBarChart2 size={14} />
              View Report
            </Link>
          )}
          {isActive && (
            <button className="btn-danger" onClick={() => abort.mutate()} disabled={abort.isPending}>
              <Ban size={14} />
              {abort.isPending ? "Aborting..." : "Abort Scan"}
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Attacks Completed" icon={Zap} value={
          <div>
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{scan.attacks_completed}</span>
            <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>/ {scan.max_attacks}</span>
          </div>
        } />
        <MetricCard label="Last Updated" icon={Clock} value={
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {formatDistanceToNow(new Date(scan.updated_at), { addSuffix: true })}
          </span>
        } />
        <MetricCard label="Status" icon={Target} value={<StatusBadge status={scan.status} />} />
      </div>

      <div className="glass-card p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Agent Pipeline</p>
        <ScanTimeline status={scan.status} />
      </div>

      {scan.max_attacks > 0 && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Attack Progress</p>
            <span className="text-xs font-bold" style={{ color: "#FF2D55" }}>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: progress + "%" }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>{scan.attacks_completed} attacks fired</span>
            <span>{scan.max_attacks - scan.attacks_completed} remaining</span>
          </div>
        </div>
      )}

      {scan.error && (
        <div className="glass-card p-4 flex gap-3" style={{ border: "1px solid rgba(255,45,85,0.3)", background: "rgba(255,45,85,0.05)" }}>
          <AlertTriangle size={16} style={{ color: "#FF2D55", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "#FF2D55" }}>Error Details</p>
            <p className="text-xs mt-1 mono" style={{ color: "var(--text-secondary)" }}>{scan.error}</p>
          </div>
        </div>
      )}

      {isActive && (
        <div className="flex items-center gap-2 justify-center py-2">
          <RefreshCw size={12} className="animate-spin-slow" style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Live updates every 3 seconds</span>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, icon: Icon, value }: { label: string; icon: React.ElementType; value: React.ReactNode }) {
  return (
    <div className="glass-card p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
      {value}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="h-8 w-64 skeleton rounded" />
      <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
      <div className="h-32 skeleton rounded-xl" />
    </div>
  );
}
`;

const base = "c:/Users/husni/OneDrive/Desktop/AURA/frontend";
const idDir = base + "/app/scans/[id]";
fs.mkdirSync(idDir, { recursive: true });
fs.writeFileSync(idDir + "/page.tsx", scanPage, "utf8");
console.log("scan page size:", fs.statSync(idDir + "/page.tsx").size);