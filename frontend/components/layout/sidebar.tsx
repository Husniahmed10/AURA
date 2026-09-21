"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ChevronDown,
  Crosshair,
  LayoutDashboard,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/scans", label: "Assessments", icon: Crosshair },
  { href: "/scans/new", label: "New assessment", icon: Plus },
];
export default function Sidebar() {
  const pathname = usePathname();
  const health = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30000,
  });
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-symbol">
          <Shield size={23} strokeWidth={1.8} />
        </span>
        <span>
          AURA<span className="brand-caption">AI SECURITY PLATFORM</span>
        </span>
      </Link>
      <div className="workspace-card">
        <span className="workspace-avatar">A</span>
        <div>
          <strong>AURA workspace</strong>
          <small>Security operations</small>
        </div>
        <ChevronDown size={14} />
      </div>
      <p className="nav-caption">WORKSPACE</p>
      <nav aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/scans"
                ? pathname.startsWith("/scans") && pathname !== "/scans/new"
                : pathname === href;
          return (
            <Link
              className={`sidebar-link ${active ? "active" : ""}`}
              href={href}
              key={href}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} />
              {label}
              {active && <span className="nav-indicator" />}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <Sparkles size={19} />
          <h3>Resilience starts here.</h3>
          <p>Understand how your AI behaves under pressure.</p>
          <Link href="/scans/new">
            Test your defenses <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="service-heading">
          <ShieldCheck size={13} /> Infrastructure
        </div>
        {[
          { name: "API", ok: health.data?.status === "healthy" },
          { name: "Redis", ok: health.data?.redis_connected },
          { name: "Pinecone", ok: health.data?.pinecone_connected },
        ].map((service) => (
          <div className="service-row" key={service.name}>
            <span>{service.name}</span>
            <span className={service.ok ? "service-online" : "service-offline"}>
              <i />
              {health.isPending
                ? "Checking"
                : health.isError
                  ? "Unavailable"
                  : service.ok
                    ? "Connected"
                    : "Degraded"}
            </span>
          </div>
        ))}
        <button
          className="sidebar-refresh"
          onClick={() => health.refetch()}
          disabled={health.isFetching}
        >
          Refresh status
        </button>
      </div>
    </aside>
  );
}
