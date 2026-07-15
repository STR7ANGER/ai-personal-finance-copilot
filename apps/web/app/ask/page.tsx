import Link from "next/link";
import { AskClient } from "./ask-client";

export default function AskPage() { return <main className="review-shell"><Link href="/" className="back-link">← Finance Copilot</Link><header className="review-header"><div><p className="eyebrow">ASK YOUR DATA</p><h1>Answers that show their work.</h1></div><p>Finance Copilot answers only from reviewed records and links every claim to the facts used.</p></header><AskClient /></main>; }
