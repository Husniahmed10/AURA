'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, Database, Server } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
  });

  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: api.listScans,
  });

  const totalScans = scans?.length || 0;
  const completedScans = scans?.filter(s => s.status === 'completed') || [];
  const avgRiskScore = completedScans.length > 0 
    ? completedScans.reduce((acc, curr) => acc + (curr.overall_risk_score || 0), 0) / completedScans.length 
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">System status and recent red teaming activity.</p>
        </div>
        <Link href="/scans/new">
          <Button>
            <ShieldAlert className="mr-2 h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {scansLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{totalScans}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {scansLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{avgRiskScore.toFixed(1)}/10</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? <Skeleton className="h-7 w-20" /> : (
              <Badge variant={health?.redis_connected ? "default" : "destructive"}>
                {health?.redis_connected ? "Connected" : "Disconnected"}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinecone DB</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? <Skeleton className="h-7 w-20" /> : (
              <Badge variant={health?.pinecone_connected ? "default" : "destructive"}>
                {health?.pinecone_connected ? "Connected" : "Disconnected"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>A list of recent security assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !scans || scans.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No scans found. Start a new scan!</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target URL</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Risk Score</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {scans.slice(0, 5).map((scan) => (
                    <tr key={scan.scan_id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">{scan.target_url}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'failed' ? 'destructive' : 'secondary'}>
                          {scan.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">{new Date(scan.created_at).toLocaleString()}</td>
                      <td className="p-4 align-middle text-right font-medium">
                        {scan.overall_risk_score !== null ? scan.overall_risk_score.toFixed(1) : '-'}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link href={`/scans/${scan.scan_id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
