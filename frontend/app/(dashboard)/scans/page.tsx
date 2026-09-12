'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function ScansList() {
  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: api.listScans,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
          <p className="text-muted-foreground">Manage your security assessments.</p>
        </div>
        <Link href="/scans/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>All historical scans and their results.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !scans || scans.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No scans found.</p>
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
                  {scans.map((scan) => (
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
