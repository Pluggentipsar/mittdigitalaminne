"use client";
import { useState, useCallback } from "react";

export function useAiAction(memoryId: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async (actionKey: string) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`/api/memories/${memoryId}/ai-actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: actionKey }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setResult(data.data.result);
        setActionLabel(data.data.action);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [memoryId]
  );

  const saveAsNote = useCallback(async () => {
    if (!result) return;
    await fetch(`/api/memories/${memoryId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `**${actionLabel}**\n\n${result}` }),
    });
  }, [memoryId, result, actionLabel]);

  const clear = useCallback(() => {
    setResult(null);
    setActionLabel(null);
    setError(null);
  }, []);

  return { loading, result, actionLabel, error, runAction, saveAsNote, clear };
}
