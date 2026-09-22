"use client";

// Talks to the local print/POS agent (see print-agent/ at the repo root)
// running on the SELLER's own PC at http://127.0.0.1:48090 — the terminal
// and printer are physically attached there, not to wherever this site is
// hosted. Every call is best-effort: if the agent isn't installed/running,
// callers fall back to a manual flow (mark paid by hand, print via the
// browser's own print dialog) rather than blocking the sale.

const AGENT_URL = "http://127.0.0.1:48090";
const AGENT_TIMEOUT_MS = 3_000;
const CHARGE_TIMEOUT_MS = 65_000; // a card charge waits on the customer's own PIN entry/tap

export const AGENT_OFFLINE_MSG =
  "Локальный агент кассы не отвечает. Проверьте, что он установлен и запущен на этом компьютере.";

export interface PosTerminal {
  id: string;
  driver: string;
  comPort: string;
  terminalPort: string;
  listening: boolean;
  terminalConnected: boolean;
}

async function agentFetch(path: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${AGENT_URL}${path}`, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function isAgentOnline(): Promise<boolean> {
  try {
    const res = await agentFetch("/health", {}, AGENT_TIMEOUT_MS);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getPosTerminals(): Promise<PosTerminal[] | null> {
  try {
    const res = await agentFetch("/pos/config", {}, AGENT_TIMEOUT_MS);
    if (!res.ok) return null;
    const data = await res.json();
    return data.terminals ?? [];
  } catch {
    return null;
  }
}

export async function getConnectedTerminals(): Promise<PosTerminal[]> {
  const terminals = await getPosTerminals();
  return (terminals ?? []).filter((t) => t.terminalConnected);
}

export interface PosChargeResult {
  ok: boolean;
  error?: string;
  offline?: boolean;
  declined?: boolean;
  transactionId?: string;
}

export async function chargeCard(amount: number, terminalId: string): Promise<PosChargeResult> {
  try {
    const res = await agentFetch(
      "/pos/charge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, terminalId }),
      },
      CHARGE_TIMEOUT_MS
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? AGENT_OFFLINE_MSG, offline: !!data.offline };
    if (!data.ok) return { ok: false, declined: true, error: data.error ?? "Транзакция отклонена терминалом" };
    return { ok: true, transactionId: data.transactionId || undefined };
  } catch {
    return { ok: false, error: AGENT_OFFLINE_MSG, offline: true };
  }
}

export async function printReceipt(printUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await agentFetch(
      "/print/bon",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: printUrl }),
      },
      15_000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? AGENT_OFFLINE_MSG };
    return { ok: true };
  } catch {
    return { ok: false, error: AGENT_OFFLINE_MSG };
  }
}
