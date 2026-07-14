"use client";

import { useEffect, useState } from "react";
import { useReviewStore } from "../../../lib/review-store";

const query = `query Review { transactionReviewQueue(limit: 25) { items { id accountName postedDate description amountMinor currency category { id name } categorySource categoryConfidence reviewStatus version possibleDuplicateCount } nextCursor } }`;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function money(amountMinor: string, currency: string) { return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amountMinor) / 100); }

export function ReviewClient() {
  const { items, setItems, selectedId, select } = useReviewStore();
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  useEffect(() => { fetch(`${apiUrl}/graphql`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) }).then((response) => { if (!response.ok) throw new Error("request failed"); return response.json(); }).then((payload) => { const next = payload.data?.transactionReviewQueue.items ?? []; setItems(next); setState(next.length ? "ready" : "empty"); }).catch(() => setState("error")); }, [setItems]);
  useEffect(() => { const listener = (event: KeyboardEvent) => { if (!items.length || !["j", "k"].includes(event.key.toLowerCase())) return; const current = Math.max(items.findIndex((item) => item.id === selectedId), 0); const next = event.key.toLowerCase() === "j" ? Math.min(current + 1, items.length - 1) : Math.max(current - 1, 0); select(items[next]!.id); }; window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, [items, select, selectedId]);
  if (state === "loading") return <div className="review-state" aria-live="polite">Loading review queue…</div>;
  if (state === "empty") return <div className="review-state"><h2>You’re caught up.</h2><p>No transactions need review.</p></div>;
  if (state === "error") return <div className="review-state" role="alert"><h2>Couldn’t load transactions.</h2><p>Start the API or sign in, then refresh.</p></div>;
  return <div className="review-list" role="list" aria-label="Transactions requiring review">{items.map((item) => <button type="button" role="listitem" className={item.id === selectedId ? "transaction-row selected" : "transaction-row"} key={item.id} onClick={() => select(item.id)}><span><strong>{item.description}</strong><small>{item.accountName} · {new Date(item.postedDate).toLocaleDateString()}</small></span><span className={BigInt(item.amountMinor) < 0n ? "debit" : "credit"}>{money(item.amountMinor, item.currency)}</span><span className="category-pill">{item.category?.name ?? "Uncategorized"}</span><span className="review-badge">{item.reviewStatus.replaceAll("_", " ")}</span></button>)}</div>;
}
