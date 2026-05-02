/**
 * NL2SQL backend client (see also frontend/nl2sql-agent)
 * Configure: VITE_NL2SQL_API_BASE (default http://localhost:8000/api)
 */

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_NL2SQL_API_BASE) ||
  "http://localhost:8000/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error((error as { detail?: string }).detail || "Request failed");
  }

  return response.json();
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: number | string;
  session_id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  sql_query?: string;
  created_at?: string;
}

export interface SSEDataPayload {
  columns: string[];
  rows: Array<{ name: string; value: number | string }>;
  raw: Array<Array<string | number>>;
}

export interface SSEChartPayload {
  type: "bar" | "line" | "pie" | "scatter" | "table";
  title: string;
  data: Array<{ name: string; value: number | string }>;
  xField?: string;
  yField?: string;
  seriesField?: string;
}

export const sessionApi = {
  list: (): Promise<Session[]> => request<Session[]>("/sessions"),
  create: (title?: string): Promise<Session> =>
    request<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify({ title: title || "新会话" }),
    }),
  getMessages: (id: string): Promise<Message[]> => request<Message[]>(`/sessions/${id}/messages`),
  delete: (id: string): Promise<void> =>
    request<void>(`/sessions/${id}`, { method: "DELETE" }),
};

function processSSEEvent(
  event: string,
  data: string,
  handlers: {
    onThinking?: (text: string) => void;
    onText?: (text: string) => void;
    onSql?: (sql: string) => void;
    onData?: (data: SSEDataPayload) => void;
    onChart?: (config: SSEChartPayload) => void;
    onError?: (error: string) => void;
    onDone?: () => void;
  }
) {
  try {
    switch (event) {
      case "thinking":
        handlers.onThinking?.(data);
        break;
      case "text":
        handlers.onText?.(data);
        break;
      case "sql":
        handlers.onSql?.(data);
        break;
      case "data":
        handlers.onData?.(JSON.parse(data) as SSEDataPayload);
        break;
      case "chart":
        handlers.onChart?.(JSON.parse(data) as SSEChartPayload);
        break;
      case "error":
        handlers.onError?.(data);
        break;
      case "done":
        handlers.onDone?.();
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("SSE parse error", e);
  }
}

export function createChatSSE(requestBody: { session_id: string; message: string }) {
  const controller = new AbortController();

  return {
    start: async (handlers: Parameters<typeof processSSEEvent>[2] & { onDone?: () => void }) => {
      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            handlers.onDone?.();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEvent = "";
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              if (currentEvent && dataLines.length > 0) {
                processSSEEvent(currentEvent, dataLines.join("\n"), handlers);
              }
              currentEvent = line.slice(7).trim();
              dataLines.length = 0;
            } else if (line.startsWith("data: ")) {
              dataLines.push(line.slice(6));
            } else if (line === "" && currentEvent && dataLines.length > 0) {
              processSSEEvent(currentEvent, dataLines.join("\n"), handlers);
              currentEvent = "";
              dataLines.length = 0;
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          handlers.onError?.((error as Error).message);
        }
      }
    },
    abort: () => controller.abort(),
  };
}
