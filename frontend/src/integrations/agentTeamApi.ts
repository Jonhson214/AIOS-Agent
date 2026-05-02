/**
 * AgentTeam contract-review API client (see also frontend/agent-team)
 * Configure: VITE_AGENT_TEAM_API_BASE (default http://localhost:8000/api/v1)
 */

const BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AGENT_TEAM_API_BASE) ||
  "http://localhost:8000/api/v1";

export interface ApiErrorShape {
  error_code: string;
  message: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "X-User-ID": "embedded-ui",
    "X-User-Role": "reviewer",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let err: ApiErrorShape;
    try {
      err = await res.json();
    } catch {
      err = { error_code: "UNKNOWN", message: `HTTP ${res.status}` };
    }
    throw new Error(err.message || err.error_code);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface UploadResponse {
  contract_id: string;
  session_id: string;
  state: string;
  is_scanned_document: boolean;
  message: string;
}

export interface ContractItem {
  id: string;
  title: string;
  original_filename: string;
  contract_status: string;
  uploaded_at: string;
  session_id?: string | null;
}

export interface SessionResponse {
  id: string;
  contract_id: string;
  state: string;
  created_at: string;
  progress_summary?: {
    total_high_risk: number;
    decided_high_risk: number;
    completion_percent: number;
  };
}

export interface ReviewItemBrief {
  id: string;
  risk_level: string;
  ai_finding: string;
  human_decision: string;
}

export const agentTeamApi = {
  uploadContract: (file: File, contractTitle?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (contractTitle) fd.append("contract_title", contractTitle);
    return request<UploadResponse>("/contracts/upload", { method: "POST", body: fd });
  },

  listContracts: (limit = 20) =>
    request<{ items: ContractItem[]; total: number }>(`/contracts?limit=${limit}`),

  getSession: (sessionId: string) => request<SessionResponse>(`/sessions/${sessionId}`),

  listItems: (sessionId: string, limit = 15) =>
    request<{ items: ReviewItemBrief[]; total: number }>(
      `/sessions/${sessionId}/items?limit=${limit}`
    ),
};
