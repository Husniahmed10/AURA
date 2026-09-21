import type { ScanStatus, Severity } from "@/types/api";

const statusConfig: Record<ScanStatus, { label: string; cls: string; dot: string }> = {
  created:    { label: "Created",    cls: "badge-created",    dot: "#6B7280" },
  recon:      { label: "Recon",      cls: "badge-recon",      dot: "#00D4FF" },
  attacking:  { label: "Attacking",  cls: "badge-attacking",  dot: "#FF6B35" },
  evaluating: { label: "Evaluating", cls: "badge-evaluating", dot: "#FFB800" },
  reporting:  { label: "Reporting",  cls: "badge-reporting",  dot: "#7C3AED" },
  completed:  { label: "Completed",  cls: "badge-completed",  dot: "#10B981" },
  failed:     { label: "Failed",     cls: "badge-failed",     dot: "#FF2D55" },
  aborted:    { label: "Aborted",    cls: "badge-aborted",    dot: "#6B7280" },
};

const severityConfig: Record<Severity, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "badge-critical" },
  high:     { label: "High",     cls: "badge-high" },
  medium:   { label: "Medium",   cls: "badge-medium" },
  low:      { label: "Low",      cls: "badge-low" },
  info:     { label: "Info",     cls: "badge-info" },
};

export function StatusBadge({ status }: { status: ScanStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.created;
  const isActive = ["recon","attacking","evaluating","reporting"].includes(status);
  return (
    <span className={`badge ${cfg.cls}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? "animate-pulse-dot" : ""}`}
        style={{ background: cfg.dot, display: "inline-block" }}
      />
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = severityConfig[severity] ?? severityConfig.info;
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
