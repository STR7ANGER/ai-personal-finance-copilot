"use client";

import { useState } from "react";

type Point = { date: string; expectedBalanceMinor: string; lowerBalanceMinor: string; upperBalanceMinor: string; drivers: string[] };
type Forecast = { currency: string; modelVersion: string; historyDays: number; points: Point[] };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function chart(points: Point[]) {
  if (!points.length) return { expected: "", band: "", min: 0, max: 0 };
  const lows = points.map((point) => Number(point.lowerBalanceMinor)); const highs = points.map((point) => Number(point.upperBalanceMinor)); const min = Math.min(...lows); const max = Math.max(...highs); const range = Math.max(max - min, 1); const x = (index: number) => index / Math.max(points.length - 1, 1) * 760 + 20; const y = (value: number) => 280 - (value - min) / range * 250;
  const expected = points.map((point, index) => `${x(index)},${y(Number(point.expectedBalanceMinor))}`).join(" ");
  const upper = points.map((point, index) => `${x(index)},${y(Number(point.upperBalanceMinor))}`); const lower = points.map((point, index) => `${x(points.length - index - 1)},${y(Number(points[points.length - index - 1]!.lowerBalanceMinor))}`);
  return { expected, band: [...upper, ...lower].join(" "), min, max };
}

export function ForecastClient() {
  const [starting, setStarting] = useState("1000"); const [horizon, setHorizon] = useState(60); const [data, setData] = useState<Forecast | null>(null); const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const generate = async () => { setStatus("loading"); const query = `query Forecast($balance:String!,$days:Int!){cashFlowForecast(startingBalanceMinor:$balance,horizonDays:$days,currency:"USD"){currency modelVersion historyDays points{date expectedBalanceMinor lowerBalanceMinor upperBalanceMinor drivers}}}`; try { const response = await fetch(`${apiUrl}/graphql`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables: { balance: String(Math.round(Number(starting) * 100)), days: horizon } }) }); const payload = await response.json(); if (!payload.data) throw new Error("forecast failed"); setData(payload.data.cashFlowForecast); setStatus("idle"); } catch { setStatus("error"); } };
  const shape = chart(data?.points ?? []); const money = (minor: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(minor / 100);
  return <div className="forecast-workspace"><form className="forecast-controls" onSubmit={(event) => { event.preventDefault(); void generate(); }}><label>Starting balance<input type="number" min="-1000000" max="10000000" step="0.01" value={starting} onChange={(event) => setStarting(event.target.value)} /></label><label>Horizon<select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label><button type="submit" disabled={status === "loading"}>{status === "loading" ? "Calculating…" : "Run forecast"}</button></form>{status === "error" && <p role="alert" className="forecast-error">Forecast unavailable. Check your session and inputs.</p>}{data ? <section className="forecast-chart" aria-label={`Projected USD balance over ${data.points.length} days`}><div className="forecast-summary"><span><small>Upper range</small><strong>{money(shape.max)}</strong></span><span><small>Lower range</small><strong>{money(shape.min)}</strong></span><span><small>History used</small><strong>{data.historyDays} days</strong></span></div><svg viewBox="0 0 800 300" role="img" aria-label="Expected balance line with uncertainty range"><polygon points={shape.band} className="forecast-band" /><polyline points={shape.expected} className="forecast-line" /></svg><p className="forecast-note">Transparent baseline · {data.modelVersion}. The shaded area is uncertainty, not a guarantee.</p></section> : <div className="review-state"><h2>Explore a scenario.</h2><p>Choose a starting balance and horizon to generate an explainable projection.</p></div>}</div>;
}
