"use client";
import Link from "next/link";
import { ArrowUpRight, Crosshair } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { ScanSummary } from "@/types/api";
export default function ScanTable({
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
        className="table-skeleton"
        role="status"
        aria-label="Loading assessments"
      >
        {[0, 1, 2].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    );
  if (!scans.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Crosshair size={25} />
        </span>
        <h3>
          {filtered
            ? "No matching assessments"
            : "Your first insight is one assessment away."}
        </h3>
        <p>
          {filtered
            ? "Try another search or status filter."
            : "Connect an AI application to discover where your defenses stand."}
        </p>
        {!filtered && (
          <Link href="/scans/new" className="btn-primary">
            Create an assessment <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Target application</th>
            <th>Status</th>
            <th>Attack attempts</th>
            <th>Risk score</th>
            <th>Created</th>
            <th>
              <span className="sr-only">View details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.scan_id}>
              <td>
                <Link href={`/scans/${scan.scan_id}`} className="target-link">
                  <span className="target-mark">
                    <Crosshair size={17} />
                  </span>
                  <span>
                    <strong title={scan.target_url}>{scan.target_url}</strong>
                    <small>{scan.scan_id}</small>
                  </span>
                </Link>
              </td>
              <td>
                <StatusBadge status={scan.status} />
              </td>
              <td className="numeric">{scan.attacks_completed}</td>
              <td>
                {scan.overall_risk_score == null ? (
                  <span className="muted">Pending</span>
                ) : (
                  <span
                    className={`risk-number ${scan.overall_risk_score >= 7 ? "risk-high" : ""}`}
                  >
                    {scan.overall_risk_score.toFixed(1)}
                    <small> / 10</small>
                  </span>
                )}
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
                  href={`/scans/${scan.scan_id}`}
                  className="row-link"
                  aria-label={`View assessment ${scan.scan_id}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
