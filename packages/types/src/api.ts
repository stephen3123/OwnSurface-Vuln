import type { ScanResult } from "./scan-result";

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface ScanRequest {
  url: string;
}

export interface ScanResponse {
  scan_id: string;
  status: "cached" | "scanning" | "completed" | "failed";
  result?: ScanResult;
  cached: boolean;
}

export interface BulkScanRequest {
  urls: string[];
}

export interface BulkJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_urls: number;
  completed_urls: number;
  failed_urls: number;
  results?: ScanResult[];
  created_at: string;
  completed_at?: string;
}

export interface RadarEvent {
  id: string;
  event_type: string;
  technology?: string;
  category?: string;
  affected_urls: string[];
  count: number;
  details?: Record<string, unknown>;
  detected_at: string;
}

export interface RadarFilters {
  event_type?: string;
  technology?: string;
  since?: string;
  limit?: number;
}

export interface Report {
  id: string;
  user_id: string;
  url: string;
  title?: string;
  scan_result: ScanResult;
  is_public: boolean;
  slug?: string;
  views: number;
  created_at: string;
}

export interface CreateReportRequest {
  url: string;
  title?: string;
  scan_result: ScanResult;
  is_public?: boolean;
}

export interface HistoryEntry {
  id: string;
  url: string;
  result: ScanResult;
  scanned_at: string;
}
