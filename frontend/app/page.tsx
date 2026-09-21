"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Crosshair,
  Layers,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import AssessmentList from "@/components/AssessmentList";

export default function DashboardPage() {
  const [period, setPeriod] = useState("30");
  const query = useQuery({
    queryKey: ["scans"],
    queryFn: api.listScans,
    refetchInterval: 15000,
  });
  const scans = query.data ?? [];
  const selected = scans.filter(
    (s) =>
      period === "all" ||
      Date.parse(s.created_at) >=
        query.dataUpdatedAt - Number(period) * 86400000,
  );
  const completed = selected.filter((s) => s.status === "completed");
  const scored = completed.filter((s) => s.overall_risk_score != null);
  const active = selected.filter(
    (s) => !["completed", "failed", "aborted"].includes(s.status),
  );
  const average = scored.length
    ? scored.reduce((sum, s) => sum + s.overall_risk_score!, 0) / scored.length
    : null;
  const groups = [
    {
      name: "Critical",
      range: "9.0–10",
      color: "#f17983",
      count: scored.filter((s) => s.overall_risk_score! >= 9).length,
    },
    {
      name: "High",
      range: "7.0–8.9",
      color: "#e9aa75",
      count: scored.filter(
        (s) => s.overall_risk_score! >= 7 && s.overall_risk_score! < 9,
      ).length,
    },
    {
      name: "Medium",
      range: "4.0–6.9",
      color: "#dfc77f",
      count: scored.filter(
        (s) => s.overall_risk_score! >= 4 && s.overall_risk_score! < 7,
      ).length,
    },
    {
      name: "Low",
      range: "0–3.9",
      color: "#87bbaa",
      count: scored.filter((s) => s.overall_risk_score! < 4).length,
    },
  ];
  const end = new Date(query.dataUpdatedAt || 0);
  end.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(end);
    date.setDate(date.getDate() - (13 - i));
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return {
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: scans.filter(
        (s) =>
          Date.parse(s.created_at) >= +date && Date.parse(s.created_at) < +next,
      ).length,
    };
  });
  const max = Math.max(2, Math.ceil(Math.max(0, ...days.map((d) => d.count)) / 2) * 2);
  const unavailable = query.isPending || query.isError;
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            THE AI SECURITY WORKSPACE
          </div>
          <h1>See the risk. Build resilience.</h1>
          <p>Your AI security posture, with the context to act.</p>
        </div>
        <div className="heading-actions">
          <button
            className="btn-secondary icon-button"
            aria-label="Refresh assessments"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              size={16}
              className={query.isFetching ? "animate-spin" : ""}
            />
          </button>
          <Link className="btn-primary" href="/scans/new">
            <Plus size={16} />
            New assessment
          </Link>
        </div>
      </div>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <div className="section-kicker">
            <Sparkles size={13} /> ADVERSARIAL BY DESIGN
          </div>
          <h2>
            Confidence is earned.
            <br />
            <span>Put your AI to the test.</span>
          </h2>
          <p>
            Discover hidden vulnerabilities with autonomous
            <br className="desktop-break" /> assessments built for the way AI
            actually works.
          </p>
          <Link href="/scans/new" className="welcome-link">
            Launch an assessment <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="security-map" aria-hidden="true">
          <div className="map-ring outer" />
          <div className="map-ring middle" />
          <div className="map-ring inner" />
          <div className="map-cross horizontal" />
          <div className="map-cross vertical" />
          <div className="map-core">
            <ShieldCheck size={46} strokeWidth={1.3} />
          </div>
          <span className="map-point p1" />
          <span className="map-point p2" />
          <span className="map-point p3" />
          <span className="map-label">INTELLIGENCE IN EVERY ASSESSMENT</span>
        </div>
        <div className="welcome-facts">
          <div>
            <Layers size={17} />
            <strong>5 attack categories</strong>
            <span>A broader perspective on risk</span>
          </div>
          <div>
            <Activity size={17} />
            <strong>Autonomous testing</strong>
            <span>From reconnaissance to report</span>
          </div>
          <div>
            <Shield size={17} />
            <strong>Actionable findings</strong>
            <span>Evidence. Severity. Remediation.</span>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <h2>Posture at a glance</h2>
        <select
          aria-label="Metrics time range"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div className="metric-grid">
        {[
          {
            name: "Total assessments",
            value: selected.length,
            note: "Across all target applications",
            icon: Crosshair,
          },
          {
            name: "In progress",
            value: active.length,
            note: active.length
              ? "Agents are actively testing"
              : "Ready for your next assessment",
            icon: Activity,
          },
          {
            name: "Completed",
            value: completed.length,
            note: "Reports ready for review",
            icon: CheckCheck,
          },
          {
            name: "Average risk score",
            value: average?.toFixed(1) ?? "—",
            note: scored.length
              ? "From completed assessments"
              : "Awaiting assessment results",
            icon: Shield,
          },
        ].map(({ name, value, note, icon: Icon }, i) => (
          <section className="metric" key={name}>
            <div className="metric-top">
              <span>{name}</span>
              <Icon size={16} />
            </div>
            <div className="metric-value">
              {unavailable ? "—" : value}
              {i === 3 && <small>/ 10</small>}
            </div>
            <div className="metric-note">
              <span className={`metric-dot dot-${i}`} />
              {note}
            </div>
          </section>
        ))}
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Assessment volume</h2>
              <p>Testing activity over the last 14 days</p>
            </div>
            <span className="chart-key">
              <i />
              Assessments
            </span>
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={
              unavailable
                ? "Assessment volume unavailable"
                : days.map((d) => `${d.label}: ${d.count}`).join(", ")
            }
          >
            <div className="chart-axis">
              <span>{max}</span>
              <span>{Math.round(max / 2)}</span>
              <span>0</span>
            </div>
            <div className="chart-plot">
              <div className="chart-gridline line-top" />
              <div className="chart-gridline line-middle" />
              <div className="chart-gridline line-bottom" />
              {days.map((d, i) => (
                <div className="chart-column" key={i}>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${unavailable ? 0 : (d.count / max) * 100}%`,
                    }}
                    title={`${d.label}: ${d.count} assessments`}
                  />
                  <span>
                    {unavailable ? "" : i % 3 === 0 || i === 13 ? d.label : ""}
                  </span>
                </div>
              ))}
            </div>
            {!unavailable && !days.some((d) => d.count) && (
              <div className="chart-empty">
                <Activity size={20} />
                <span>No assessment activity in this period</span>
              </div>
            )}
            {query.isError && (
              <div className="chart-empty">Activity data unavailable</div>
            )}
          </div>
          <div className="panel-foot">
            <span>
              {unavailable
                ? "Awaiting data"
                : `${days.reduce((sum, d) => sum + d.count, 0)} assessments in the last 14 days`}
            </span>
            <Link href="/scans">
              Explore activity <ArrowRight size={13} />
            </Link>
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Risk breakdown</h2>
              <p>Completed assessments by score</p>
            </div>
            <ArrowDownRight size={18} className="muted" />
          </div>
          <div className="risk-breakdown">
            {groups.map((g) => (
              <div className="risk-row" key={g.name}>
                <span className="risk-color" style={{ background: g.color }} />
                <span>
                  {g.name}
                  <small>{g.range}</small>
                </span>
                <div className="risk-track">
                  <i
                    style={{
                      width: `${scored.length ? (g.count / scored.length) * 100 : 0}%`,
                      background: g.color,
                    }}
                  />
                </div>
                <strong>{unavailable ? "—" : g.count}</strong>
              </div>
            ))}
          </div>
          <div className="panel-foot">
            <span>
              {unavailable
                ? "Awaiting data"
                : `${scored.length} scored assessments`}
            </span>
            <span>Scale: 0–10</span>
          </div>
        </section>
      </div>
      <AssessmentList
        scans={selected}
        loading={query.isPending}
        error={query.isError}
        onRetry={() => query.refetch()}
      />
      <section className="next-step">
        <span className="next-step-icon">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h3>Make security part of every release.</h3>
          <p>
            Reassess your applications as models, prompts, and tools evolve.
          </p>
        </div>
        <Link href="/scans/new">
          Start an assessment <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}
