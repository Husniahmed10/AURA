import axios from "axios";
import type {
  HealthResponse,
  ScanConfigRequest,
  ScanStatusResponse,
  ScanSummary,
  SecurityReport,
} from "../types/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  health: (): Promise<HealthResponse> =>
    apiClient.get("/health").then((r) => r.data),

  listScans: (): Promise<ScanSummary[]> =>
    apiClient.get("/scans").then((r) => r.data),

  startScan: (payload: ScanConfigRequest): Promise<ScanStatusResponse> =>
    apiClient.post("/scans", payload).then((r) => r.data),

  getScan: (id: string): Promise<ScanStatusResponse> =>
    apiClient.get(`/scans/${id}`).then((r) => r.data),

  abortScan: (id: string): Promise<void> =>
    apiClient.delete(`/scans/${id}`).then((r) => r.data),

  getReport: (id: string): Promise<SecurityReport> =>
    apiClient.get(`/scans/${id}/report`).then((r) => r.data),

  getPdfUrl: (id: string): string =>
    `${BASE}/scans/${id}/report/pdf`,
};
