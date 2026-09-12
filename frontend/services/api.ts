import axios from 'axios';
import { HealthResponse, ScanConfigRequest, ScanStatusResponse, ScanSummary, SecurityReport } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  checkHealth: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get('/health');
    return data;
  },

  // Scans
  listScans: async (): Promise<ScanSummary[]> => {
    const { data } = await apiClient.get('/scans');
    return data;
  },
  
  startScan: async (payload: ScanConfigRequest): Promise<ScanStatusResponse> => {
    const { data } = await apiClient.post('/scans', payload);
    return data;
  },

  getScanStatus: async (scanId: string): Promise<ScanStatusResponse> => {
    const { data } = await apiClient.get(`/scans/${scanId}`);
    return data;
  },

  abortScan: async (scanId: string): Promise<void> => {
    await apiClient.delete(`/scans/${scanId}`);
  },

  // Reports
  getReportJson: async (scanId: string): Promise<SecurityReport> => {
    const { data } = await apiClient.get(`/scans/${scanId}/report`);
    return data;
  },

  getReportPdfUrl: (scanId: string): string => {
    return `${API_BASE_URL}/scans/${scanId}/report/pdf`;
  },
};
