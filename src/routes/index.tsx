import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, PieChart, Wallet, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-aurora">
      <div className="bg-grid">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">L</div>
            <span className="font-display text-lg font-semibold">Lumen</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Get started</Link>
          </nav>
        </header>

        <section className="mx-auto max-w-5xl px-6 pb-24 pt-16 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Built for clarity in your finances
          </div>
          <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Money, beautifully<br />in focus.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Track income, expenses and budgets in a calm, minimal dashboard. Get instant insights into where your money goes — every category, every month.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-accent">
              Sign in
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 pb-24 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Unified ledger", desc: "Log income and expenses with categories, notes and dates in seconds." },
            { icon: PieChart, title: "Category insights", desc: "See exactly where your money flows with live category breakdowns." },
            { icon: BarChart3, title: "Monthly trends", desc: "Compare months side-by-side to spot patterns before they cost you." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Your data is yours. Encrypted at rest.</div>
            <div>© {new Date().getFullYear()} Lumen</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
