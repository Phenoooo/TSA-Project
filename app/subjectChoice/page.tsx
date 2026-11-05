import Link from "next/link";

export default function SubjectChoice() {
  return (
    <main className="app-page">
      <section className="app-panel">
        <p className="app-eyebrow">Choose a starting point</p>
        <h1 className="mt-2 text-xl font-medium text-[var(--app-text)]">
          Algebra
        </h1>
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
          Start with a short multiple-choice diagnostic.
        </p>
        <Link
          className="app-action app-action--primary mt-5"
          href="/algebraDiagnosticMCQ"
        >
          Start diagnostic
        </Link>
      </section>
    </main>
  );
}
