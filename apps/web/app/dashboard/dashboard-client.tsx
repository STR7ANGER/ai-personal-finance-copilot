"use client";

import { useEffect, useState } from "react";

type Dashboard = { budgets: Array<{ id: string; name: string; totalLimitMinor: string; spentMinor: string; currency: string }>; goals: Array<{ id: string; name: string; targetMinor: string; currentMinor: string; currency: string; targetDate: string | null; status: string }>; subscriptions: Array<{ id: string; merchant: string; amountMinor: string; currency: string; cadence: string; nextChargeDate: string }>; calculatedAt: string };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const money = (minor: string, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(minor) / 100);
const progress = (current: string, target: string) => Math.min(Math.round(Number(current) / Math.max(Number(target), 1) * 100), 100);

export function DashboardClient() {
  const [data, setData] = useState<Dashboard | null>(null); const [error, setError] = useState(false);
  useEffect(() => { const month = new Date().toISOString().slice(0, 7); const query = `query Dashboard($month:String!){ financialDashboard(month:$month,currency:"USD"){ budgets{id name totalLimitMinor spentMinor currency} goals{id name targetMinor currentMinor currency targetDate status} subscriptions{id merchant amountMinor currency cadence nextChargeDate} calculatedAt } }`; fetch(`${apiUrl}/graphql`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables: { month } }) }).then((response) => response.json()).then((payload) => { if (!payload.data) throw new Error("missing dashboard"); setData(payload.data.financialDashboard); }).catch(() => setError(true)); }, []);
  if (error) return <div className="review-state" role="alert">Couldn’t load your dashboard. Sign in and retry.</div>;
  if (!data) return <div className="review-state" aria-live="polite">Calculating your financial dashboard…</div>;
  return <div className="dashboard-grid">
    <section className="dashboard-panel"><p className="eyebrow">BUDGETS</p>{data.budgets.length ? data.budgets.map((budget) => { const percent = progress(budget.spentMinor, budget.totalLimitMinor); return <article key={budget.id}><div className="metric-row"><strong>{budget.name}</strong><span>{money(budget.spentMinor, budget.currency)} / {money(budget.totalLimitMinor, budget.currency)}</span></div><progress value={percent} max="100" aria-label={`${budget.name} is ${percent}% used`} /><small>{percent}% used</small></article>; }) : <p className="empty-copy">No budget for this month yet.</p>}</section>
    <section className="dashboard-panel"><p className="eyebrow">GOALS</p>{data.goals.length ? data.goals.map((goal) => { const percent = progress(goal.currentMinor, goal.targetMinor); return <article key={goal.id}><div className="metric-row"><strong>{goal.name}</strong><span>{percent}%</span></div><progress value={percent} max="100" aria-label={`${goal.name} is ${percent}% complete`} /><small>{money(goal.currentMinor, goal.currency)} of {money(goal.targetMinor, goal.currency)}</small></article>; }) : <p className="empty-copy">Create a goal to track meaningful progress.</p>}</section>
    <section className="dashboard-panel subscriptions"><p className="eyebrow">UPCOMING SUBSCRIPTIONS</p>{data.subscriptions.length ? data.subscriptions.map((item) => <article key={item.id} className="subscription-row"><span><strong>{item.merchant}</strong><small>{item.cadence.toLowerCase()} · {new Date(item.nextChargeDate).toLocaleDateString()}</small></span><span>{money(item.amountMinor, item.currency)}</span></article>) : <p className="empty-copy">No upcoming subscription charges in the next 45 days.</p>}</section>
  </div>;
}
