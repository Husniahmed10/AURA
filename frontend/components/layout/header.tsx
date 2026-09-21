"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search, Shield } from "lucide-react";
export default function Header() {
  const path = usePathname();
  const title =
    path === "/"
      ? "Overview"
      : path === "/scans"
        ? "Assessments"
        : path === "/scans/new"
          ? "New assessment"
          : path.endsWith("/report")
            ? "Security report"
            : "Assessment monitor";
  return (
    <header className="console-header">
      <div className="breadcrumbs">
        <Shield size={15} />
        <span>Workspace</span>
        <ChevronRight size={13} />
        <strong>{title}</strong>
      </div>
      <div className="header-tools">
        <form action="/scans" className="global-search">
          <Search size={15} />
          <input
            name="q"
            aria-label="Search assessments"
            placeholder="Search assessments…"
          />
          <kbd>↵</kbd>
        </form>
        <span className="workspace-badge">A</span>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/">Overview</Link>
        <Link href="/scans">Assessments</Link>
        <Link href="/scans/new">+ New assessment</Link>
      </nav>
    </header>
  );
}
