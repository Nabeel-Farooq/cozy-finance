import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCategories, useProfile, useTransactions } from "@/hooks/use-data";
import { formatCurrency, formatDate, monthKey, monthLabel } from "@/lib/format";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const currency = profile?.currency ?? "USD";

  const stats = useMemo(() => {
    const now = new Date();
    const thisKey = monthKey(now);
    let totalIncome = 0, totalExpense = 0, monthIncome = 0, monthExpense = 0;
    for (const t of transactions) {
      const k = monthKey(new Date(t.occurred_on));
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
      if (k === thisKey) {
        if (t.type === "income") monthIncome += t.amount;
        else monthExpense += t.amount;
      }
    }
    return {
      balance: totalIncome - totalExpense,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
    };
  }, [transactions]);

  const monthlySeries = useMemo(() => {
    const map = new Map<string, { key: string; income: number; expense: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      map.set(k, { key: k, income: 0, expense: 0 });
    }
    for (const t of transactions) {
      const k = monthKey(new Date(t.occurred_on));
      const e = map.get(k);
      if (!e) continue;
      if (t.type === "income") e.income += t.amount;
      else e.expense += t.amount;
    }
    return Array.from(map.values()).map((m) => ({ month: monthLabel(m.key), Income: m.income, Expense: m.expense }));
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const thisKey = monthKey(now);
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (monthKey(new Date(t.occurred_on)) !== thisKey) continue;
      if (!t.category_id) continue;
      byCat.set(t.category_id, (byCat.get(t.category_id) ?? 0) + t.amount);
    }
    return Array.from(byCat.entries())
      .map(([id, amount]) => {
        const cat = categories.find((c) => c.id === id);
        return { name: cat?.name ?? "Uncategorised", value: amount, color: cat?.color ?? "#6b7280" };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const recent = transactions.slice(0, 8);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Dashboard</h1>
        </div>
        <AddTransactionDialog />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total balance"
          value={formatCurrency(stats.balance, currency)}
          icon={Wallet}
          accent
        />
        <StatCard
          label="Income (this month)"
          value={formatCurrency(stats.monthIncome, currency)}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Expenses (this month)"
          value={formatCurrency(stats.monthExpense, currency)}
          icon={TrendingDown}
          trend="down"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="glass rounded-2xl p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Monthly comparison</h3>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.7 0.03 270)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.21 0.05 278)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, color: "white" }}
                  formatter={(v: number) => formatCurrency(v, currency)}
                />
                <Bar dataKey="Income" fill="oklch(0.72 0.18 155)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="oklch(0.62 0.22 277)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Spending by category</h3>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>
          {categoryBreakdown.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">No expenses yet this month</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {categoryBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "oklch(0.21 0.05 278)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, color: "white" }}
                      formatter={(v: number) => formatCurrency(v, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {categoryBreakdown.slice(0, 5).map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatCurrency(c.value, currency)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent transactions</h3>
        </div>
        {recent.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No transactions yet — add your first one to get started.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((t) => {
              const cat = categories.find((c) => c.id === t.category_id);
              return (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        t.type === "income" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                      )}
                    >
                      {t.type === "income" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{cat?.name ?? "Uncategorised"}</p>
                      <p className="text-xs text-muted-foreground">{t.note || formatDate(t.occurred_on)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", t.type === "income" ? "text-success" : "text-foreground")}>
                      {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.occurred_on)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, accent }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down"; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl p-6 border border-border",
      accent ? "bg-gradient-to-br from-primary to-[oklch(0.45_0.2_290)] text-primary-foreground" : "glass"
    )}>
      <div className="flex items-center justify-between">
        <p className={cn("text-sm", accent ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
        <Icon className={cn("h-5 w-5", accent ? "text-primary-foreground/80" : trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground")} />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
