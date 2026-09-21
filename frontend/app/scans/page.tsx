"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import AssessmentList from "@/components/AssessmentList";
function Assessments() {
  const params = useSearchParams();
  const query = useQuery({
    queryKey: ["scans"],
    queryFn: api.listScans,
    refetchInterval: 15000,
  });
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SECURITY OPERATIONS</div>
          <h1>Assessments</h1>
          <p>Your complete history of adversarial testing.</p>
        </div>
        <Link href="/scans/new" className="btn-primary">
          <Plus size={16} />
          New assessment
        </Link>
      </div>
      <AssessmentList
        key={params.get("q") ?? ""}
        initialSearch={params.get("q") ?? ""}
        scans={query.data ?? []}
        loading={query.isPending}
        error={query.isError}
        onRetry={() => query.refetch()}
      />
    </div>
  );
}
export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64" />}>
      <Assessments />
    </Suspense>
  );
}
