import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

export function AddTransactionDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const { data: categories } = useCategories();
  const qc = useQueryClient();

  const filtered = categories?.filter((c) => c.type === type) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("transactions").insert({
      user_id: userRes.user!.id,
      type,
      amount: amt,
      category_id: categoryId,
      note: note || null,
      occurred_on: date,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Transaction added");
    qc.invalidateQueries({ queryKey: ["transactions"] });
    setOpen(false);
    setAmount(""); setNote(""); setCategoryId("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button><Plus className="h-4 w-4" /> Add transaction</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">New transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId(""); }}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium capitalize transition",
                  type === t ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {filtered.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" placeholder="Optional" />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Save transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
