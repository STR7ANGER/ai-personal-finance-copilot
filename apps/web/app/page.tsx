const cards = [
  ["Import statements", "Upload a CSV and watch normalization progress."],
  ["Review transactions", "Confirm categories before insights use them."],
  ["Understand spending", "Ask grounded questions about your own data."],
];

export default function HomePage() {
  return (
    <main>
      <p className="eyebrow">AI PERSONAL FINANCE COPILOT</p>
      <h1>Know where your money is going.</h1>
      <p className="lede">A privacy-first workspace for imports, budgets, forecasts, and explainable answers.</p>
      <section aria-label="Product capabilities">
        {cards.map(([title, body]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
