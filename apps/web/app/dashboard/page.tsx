import Link from "next/link";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() { return <main className="review-shell"><Link href="/" className="back-link">← Finance Copilot</Link><header className="review-header"><div><p className="eyebrow">FINANCIAL DASHBOARD</p><h1>Turn plans into progress.</h1></div><p>Monthly budgets, savings goals, and upcoming recurring charges—calculated from reviewed transactions only.</p></header><DashboardClient /></main>; }
