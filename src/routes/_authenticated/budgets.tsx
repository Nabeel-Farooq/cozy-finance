import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgets, useCategories, useProfile, useTransactions } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, monthKey } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const { data: budgets = [] } = useBudgets();
  const { data: categories = [] } = useCategories();
  const { data: txs = [] } = useTransactions();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const currency = profile?.currency ?? "USD";

  const thisMonth = monthKey(new Date());

  const monthBudgets = useMemo(() => {
    return budgets
      .filter((b) => b.month.startsWith(thisMonth))
      .map((b) => {
        const cat = categories.find((c) => c.id === b.category_id);
        const spent = txs
          .filter((t) => t.category_id === b.category_id && t.type === "expense" && monthKey(new Date(t.occurred_on)) === thisMonth)
          .reduce((s, t) => s + t.amount, 0);
        const pct = Math.min(100, (spent / b.amount) * 100);
        return { ...b, cat, spent, pct };
      });
  }, [budgets, categories, txs, thisMonth]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Budgets</h1>
          <p className="text-sm text-muted-foreground">Set monthly limits per category.</p>
        </div>
        <AddBudgetDialog />
      </header>

      {monthBudgets.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
          No budgets set for this month — add one to start tracking your limits.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {monthBudgets.map((b) => (
            <div key={b.id} className="group glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: b.cat?.color ?? "#888" }} />
                  <h4 className="font-medium">{b.cat?.name ?? "Category"}</h4>
                </div>
                <button onClick={() => handleDelete(b.id)} className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="font-display text-2xl font-semibold">{formatCurrency(b.spent, currency)}</p>
                <p className="text-sm text-muted-foreground">of {formatCurrency(b.amount, currency)}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full transition-all", b.pct >= 100 ? "bg-destructive" : b.pct >= 80 ? "bg-warning" : "bg-success")} style={{ width: `${b.pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{b.pct.toFixed(0)}% used</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddBudgetDialog() {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();
  const expense = categories.filter((c) => c.type === "expense");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    const { data: userRes } = await supabase.auth.getUser();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { error } = await supabase.from("budgets").upsert({
      user_id: userRes.user!.id, category_id: categoryId, amount: amt, month: monthStart,
    }, { onConflict: "user_id,category_id,month" });
    if (error) return toast.error(error.message);
    toast.success("Budget saved");
    qc.invalidateQueries({ queryKey: ["budgets"] });
    setOpen(false); setAmount(""); setCategoryId("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> New budget</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">New budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick expense category" /></SelectTrigger>
              <SelectContent>
                {expense.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bamt">Monthly limit</Label>
            <Input id="bamt" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
