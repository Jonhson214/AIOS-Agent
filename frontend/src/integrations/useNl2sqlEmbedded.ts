import { useCallback, useEffect, useRef, useState } from "react";
import {
  createChatSSE,
  sessionApi,
  type Message,
  type Session,
  type SSEChartPayload,
  type SSEDataPayload,
} from "./nl2sqlApi";

export type ChartConfig = {
  type: SSEChartPayload["type"];
  title: string;
  data: Array<{ name: string; value: number | string }>;
  xField?: string;
  yField?: string;
  seriesField?: string;
};

export type TableData = {
  columns: string[];
  rows: Array<{ name: string; value: number | string }>;
  raw?: Array<Array<string | number>>;
};

const genId = () => Math.random().toString(36).slice(2, 12);
const nowIso = () => new Date().toISOString();

export function useNl2sqlEmbedded() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setStreaming] = useState(false);
  const [currentSql, setCurrentSql] = useState<string | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await sessionApi.list();
        if (cancelled) return;
        setSessions(data);
        setCurrentSessionId((cur) => cur ?? data[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) setBackendError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectSession = useCallback(async (id: string) => {
    setCurrentSessionId(id);
    setBackendError(null);
    try {
      const msgs = await sessionApi.getMessages(id);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
    setChartConfig(null);
    setTableData(null);
    setCurrentSql(null);
  }, []);

  const createSession = useCallback(async (title?: string) => {
    try {
      const s = await sessionApi.create(title);
      setSessions((prev) => [s, ...prev]);
      setCurrentSessionId(s.id);
      setMessages([]);
      setChartConfig(null);
      setTableData(null);
      setCurrentSql(null);
      return s;
    } catch (e) {
      setBackendError((e as Error).message);
      return null;
    }
  }, []);

  const clearChartData = useCallback(() => {
    setChartConfig(null);
    setTableData(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      let sessionId = currentSessionId;
      if (!sessionId) {
        const s = await sessionApi.create(trimmed.slice(0, 28)).catch(() => null);
        if (s) {
          sessionId = s.id;
          setSessions((prev) => [s, ...prev]);
          setCurrentSessionId(s.id);
        } else {
          setBackendError("无法创建会话，请确认 NL2SQL 后端已启动");
          return;
        }
      }

      clearChartData();
      setCurrentSql(null);

      const userMsg: Message = {
        id: genId(),
        session_id: sessionId!,
        role: "user",
        content: trimmed,
        created_at: nowIso(),
      };
      setMessages((prev) => [...prev, userMsg]);

      setStreaming(true);
      const assistantPlaceholder: Message = {
        id: genId(),
        session_id: sessionId!,
        role: "assistant",
        content: "",
        created_at: nowIso(),
      };
      setMessages((prev) => [...prev, assistantPlaceholder]);

      let fullText = "";
      const sse = createChatSSE({ session_id: sessionId!, message: trimmed });
      abortRef.current = sse.abort;

      await sse.start({
        onText: (text) => {
          fullText += text;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: fullText };
            }
            return next;
          });
        },
        onSql: (sql) => {
          setCurrentSql(sql);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, sql_query: sql };
            }
            return next;
          });
        },
        onData: (data: SSEDataPayload) => {
          setTableData({
            columns: data.columns,
            rows: data.rows,
            raw: data.raw,
          });
        },
        onChart: (config: SSEChartPayload) => {
          setChartConfig({
            type: config.type,
            title: config.title,
            data: config.data,
            xField: config.xField,
            yField: config.yField,
            seriesField: config.seriesField,
          });
        },
        onError: (err) => {
          fullText += `\n\n**错误:** ${err}`;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: fullText };
            }
            return next;
          });
        },
        onDone: () => {
          setStreaming(false);
          abortRef.current = null;
        },
      });
    },
    [currentSessionId, isStreaming, clearChartData]
  );

  const abort = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  return {
    sessions,
    currentSessionId,
    messages,
    isStreaming,
    currentSql,
    chartConfig,
    tableData,
    backendError,
    selectSession,
    createSession,
    sendMessage,
    abort,
  };
}
