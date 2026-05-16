import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useProfile, useTransactions } from "@/hooks/use-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: txs = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const currency = profile?.currency ?? "USD";

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  const filtered = useMemo(() => {
    return txs.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (categoryId !== "all" && t.category_id !== categoryId) return false;
      if (search) {
        const cat = categories.find((c) => c.id === t.category_id)?.name ?? "";
        const hay = `${t.note ?? ""} ${cat}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [txs, type, categoryId, search, categories]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Transactions</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {txs.length} entries</p>
        </div>
        <AddTransactionDialog />
      </header>

      <div className="glass rounded-2xl p-4 grid gap-3 md:grid-cols-[1fr_180px_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notes or category" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-2xl">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No transactions match your filters.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.category_id);
              return (
                <li key={t.id} className="group flex items-center justify-between px-4 py-3 md:px-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg shrink-0",
                      t.type === "income" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                    )}>
                      {t.type === "income" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: cat?.color ?? "#888" }} />
                          {cat?.name ?? "Uncategorised"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{t.note || formatDate(t.occurred_on)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", t.type === "income" ? "text-success" : "text-foreground")}>
                        {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.occurred_on)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded-md p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
