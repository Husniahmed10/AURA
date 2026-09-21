"use client";
import { useState } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import ScanTable from "@/components/ui/ScanTable";
import type { ScanSummary } from "@/types/api";
export default function AssessmentList({
  scans,
  loading,
  error,
  onRetry,
  initialSearch = "",
}: {
  scans: ScanSummary[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState("all");
  const filtered = [...scans]
    .filter(
      (s) =>
        (filter === "all" ||
          (filter === "active" &&
            !["completed", "failed", "aborted"].includes(s.status)) ||
          s.status === filter) &&
        `${s.scan_id} ${s.target_url}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(filtered, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aura-assessments.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>
            Assessment activity{" "}
            <span className="count-pill">{error ? "—" : scans.length}</span>
          </h2>
          <p>Every run, from first probe to final report.</p>
        </div>
        <button
          className="btn-secondary compact"
          onClick={exportData}
          disabled={!filtered.length || error}
        >
          <Download size={14} />
          Export JSON
        </button>
      </div>
      <div className="assessment-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Assessment status"
        >
          {[
            { id: "all", name: "All assessments" },
            { id: "active", name: "Active" },
            { id: "completed", name: "Completed" },
            { id: "failed", name: "Failed" },
          ].map((item) => (
            <button
              key={item.id}
              aria-pressed={filter === item.id}
              className={filter === item.id ? "selected" : ""}
              onClick={() => setFilter(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={14} />
          <input
            aria-label="Filter assessments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by target or ID…"
          />
          <SlidersHorizontal size={13} />
        </label>
      </div>
      {error ? (
        <div className="notice error" role="alert">
          <div>
            <strong>We couldn’t load your assessments.</strong>
            <p>Check the API connection, then try again.</p>
          </div>
          <button className="btn-secondary compact" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : (
        <ScanTable
          scans={filtered}
          loading={loading}
          filtered={!!search || filter !== "all"}
        />
      )}
      <div className="panel-foot">
        <span>
          {error
            ? "Data unavailable"
            : `${filtered.length} assessment${filtered.length === 1 ? "" : "s"}`}
        </span>
        <span>Auto-refresh · 15 seconds</span>
      </div>
    </section>
  );
}
