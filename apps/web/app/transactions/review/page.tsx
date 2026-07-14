import Link from "next/link";
import { ReviewClient } from "./review-client";

export default function TransactionReviewPage() {
  return <main className="review-shell"><Link href="/" className="back-link">← Finance Copilot</Link><header className="review-header"><div><p className="eyebrow">TRANSACTION REVIEW</p><h1>Make every transaction trustworthy.</h1></div><p>Use J/K to move through the queue. Confirm categories and investigate possible duplicates before they affect budgets or forecasts.</p></header><ReviewClient /></main>;
}
