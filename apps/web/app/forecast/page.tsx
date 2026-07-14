import Link from "next/link";
import { ForecastClient } from "./forecast-client";

export default function ForecastPage() { return <main className="review-shell"><Link href="/" className="back-link">← Finance Copilot</Link><header className="review-header"><div><p className="eyebrow">CASH-FLOW FORECAST</p><h1>See the shape of what’s next.</h1></div><p>Project reviewed income, spending, subscriptions, and explicit scenarios. This planning estimate is not financial advice.</p></header><ForecastClient /></main>; }
