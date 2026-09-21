"use client";
import Link from "next/link";
import { ArrowUpRight, Crosshair, Search } from "lucide-react";
import type { ScanSummary } from "@/types/api";

export function ScanTable({
  scans,
  loading = false,
  filtered = false,
}: {
  scans: ScanSummary[];
  loading?: boolean;
  filtered?: boolean;
}) {
  if (loading)
    return (
      <div
        className="table-loading"
        aria-label="Loading assessments"
        role="status"
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse" />
        ))}
      </div>
    );
  if (!scans.length)
    return (
      <div className="empty-state">
        {filtered ? <Search /> : <Crosshair />}
        <h3>
          {filtered
            ? "No matching assessments"
            : "Your next insight starts here"}
        </h3>
        <p>
          {filtered
            ? "Try a different target, scan ID, or status."
            : "Launch your first assessment to uncover risks in your AI applications."}
        </p>
        {!filtered && (
          <Link className="text-link" href="/scans/new">
            Create an assessment <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="scan-table">
        <thead>
          <tr>
            <th>Target application</th>
            <th>Status</th>
            <th>Attacks</th>
            <th>Risk score</th>
            <th>Created</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.scan_id}>
              <td>
                <Link href={`/scans/${scan.scan_id}`} className="target-cell">
                  <span className="target-icon">
                    <Crosshair size={17} />
                  </span>
                  <span>
                    <strong>{scan.target_url}</strong>
                    <small>{scan.scan_id}</small>
                  </span>
                </Link>
              </td>
              <td>
                <span className={`status-badge status-${scan.status}`}>
                  <span />
                  {scan.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="tabular-nums">{scan.attacks_completed}</td>
              <td>
                <span
                  className={`risk-value ${(scan.overall_risk_score ?? 0) >= 7 ? "risk-high" : ""}`}
                >
                  {scan.overall_risk_score == null
                    ? "—"
                    : scan.overall_risk_score.toFixed(1)}
                  {scan.overall_risk_score != null && <small> / 10</small>}
                </span>
              </td>
              <td className="date-cell">
                {new Date(scan.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td>
                <Link
                  className="row-action"
                  href={`/scans/${scan.scan_id}`}
                  aria-label={`View assessment ${scan.scan_id}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
