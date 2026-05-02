/**
 * GraphRAG backend client (see also frontend/graphrag-agent)
 * Configure: VITE_GRAPHRAG_API_BASE (default http://localhost:8000/api/v1)
 */

const BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GRAPHRAG_API_BASE) ||
  "http://localhost:8000/api/v1";

export class ApiError extends Error {
  code: number;
  constructor(code: number, msg: string) {
    super(msg);
    this.code = code;
  }
}

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    formData?: FormData;
    params?: Record<string, string | number | boolean | undefined | null>;
  } = {}
): Promise<T> {
  let url = BASE + path;

  if (options.params) {
    const parts = Object.entries(options.params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    if (parts.length) url += "?" + parts.join("&");
  }

  const init: RequestInit = { method };
  if (options.formData) {
    init.body = options.formData;
  } else if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);
  const json = await res.json();
  if (json.code !== 0) throw new ApiError(json.code, json.msg ?? "Unknown error");
  return json.data as T;
}

const get = <T>(path: string, params?: Record<string, string | number | boolean | undefined | null>) =>
  request<T>("GET", path, { params });
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, { body });

export interface ApiToolCall {
  step: number;
  tool_name: string;
  tool_input: string;
  tool_output: string;
}

export interface ApiQueryResult {
  id: string;
  question: string;
  answer: string;
  tool_calls: ApiToolCall[];
  cited_nodes: string[];
  duration_seconds: number;
  timestamp: string;
}

export const graphragApi = {
  query: (question: string, history: { question: string; answer: string }[] = []) =>
    post<ApiQueryResult>("/query", { question, history }),

  getQueryHistory: (page = 1, pageSize = 50) =>
    get<{ total: number; page: number; page_size: number; items: ApiQueryResult[] }>(
      "/query/history",
      { page, page_size: pageSize }
    ),

  getHealth: () => get<{ status: string; version?: string }>("/health"),
};
