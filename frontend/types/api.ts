export type AttackCategory = "prompt_injection" | "jailbreak" | "data_extraction" | "guardrail_bypass" | "agent_specific";

export interface ScanConfigRequest {
  target_url: string;
  scope?: AttackCategory[];
  max_attacks?: number;
  timeout_seconds?: number;
}

export interface ScanSummary {
  scan_id: string;
  status: string;
  target_url: string;
  created_at: string;
  attacks_completed: number;
  overall_risk_score: number | null;
}

export interface ScanStatusResponse {
  scan_id: string;
  status: string;
  attacks_completed: number;
  max_attacks: number;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  redis_connected: boolean;
  pinecone_connected: boolean;
  version: string;
}

export interface SecurityReport {
  scan_id: string;
  target_url: string;
  overall_risk_score: number;
  success_rate: number;
  total_attacks: number;
  successful_attacks: number;
  executive_summary: string;
  trace_url?: string;
  vulnerabilities: any[]; // Kept generic for simplicity, but could be strongly typed
  scan_date: string;
}
