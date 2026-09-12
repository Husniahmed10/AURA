'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Download, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ScanStatusPage() {
  const params = useParams();
  const scanId = params.id as string;

  // Poll scan status every 2 seconds if not completed/failed/aborted
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['scan_status', scanId],
    queryFn: () => api.getScanStatus(scanId),
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state && (state.status === 'completed' || state.status === 'failed' || state.status === 'aborted')) {
        return false;
      }
      return 2000;
    },
  });

  // Only fetch report if status is completed
  const isCompleted = statusData?.status === 'completed';
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['scan_report', scanId],
    queryFn: () => api.getReportJson(scanId),
    enabled: isCompleted,
  });

  if (statusLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const progress = statusData ? Math.min(100, Math.round((statusData.attacks_completed / statusData.max_attacks) * 100)) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Scan Details</h1>
            <Badge variant={
              statusData?.status === 'completed' ? 'default' :
              statusData?.status === 'failed' ? 'destructive' : 'secondary'
            }>
              {statusData?.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm mt-1">{scanId}</p>
        </div>
        {isCompleted && (
          <a href={api.getReportPdfUrl(scanId)} target="_blank" rel="noreferrer">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
          </a>
        )}
      </div>

      {!isCompleted && statusData?.status !== 'failed' && statusData?.status !== 'aborted' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Scan in Progress
            </CardTitle>
            <CardDescription>The agent is actively probing the target application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{statusData?.attacks_completed} attacks fired</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground animate-pulse mt-2">
              Waiting for LangGraph execution to complete...
            </p>
          </CardContent>
        </Card>
      )}

      {isCompleted && reportLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isCompleted && reportData && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${reportData.overall_risk_score > 7 ? 'text-destructive' : reportData.overall_risk_score > 4 ? 'text-orange-500' : 'text-green-500'}`}>
                  {reportData.overall_risk_score.toFixed(1)} <span className="text-xl text-muted-foreground">/ 10</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attacks Fired</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{reportData.total_attacks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vulnerabilities Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{reportData.successful_attacks}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {reportData.executive_summary}
              </p>
              {reportData.trace_url && (
                <div className="mt-4">
                  <a href={reportData.trace_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View full agent trace in LangSmith &rarr;
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mt-4">Discovered Vulnerabilities</h2>
          {reportData.vulnerabilities.length === 0 ? (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="flex flex-col items-center justify-center p-8 text-green-600 dark:text-green-400">
                <ShieldCheck className="h-12 w-12 mb-2" />
                <p className="font-semibold">No vulnerabilities found!</p>
                <p className="text-sm">The target application successfully blocked all attacks.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reportData.vulnerabilities.map((vuln: any, i: number) => (
                <Card key={i} className="border-l-4 border-l-destructive">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {vuln.category.replace(/_/g, ' ').toUpperCase()}
                        </CardTitle>
                        <CardDescription className="mt-1">Severity: <span className="font-bold text-foreground">{vuln.severity}</span></CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded-md overflow-x-auto">
                      <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Attack Payload</p>
                      <pre className="text-sm font-mono whitespace-pre-wrap">{vuln.payload}</pre>
                    </div>
                    <div className="bg-destructive/10 p-3 rounded-md overflow-x-auto">
                      <p className="text-xs text-destructive mb-1 uppercase font-semibold">Model Response</p>
                      <pre className="text-sm font-mono whitespace-pre-wrap">{vuln.response}</pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
