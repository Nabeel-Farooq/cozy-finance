import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";

const PALETTE = ["#4f46e5", "#10b981", "#06b6d4", "#a78bfa", "#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#22c55e", "#eab308"];

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  async function handleDelete(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Categories</h1>
          <p className="text-sm text-muted-foreground">Organise your income and spending.</p>
        </div>
        <AddCategoryDialog />
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          { title: "Income", items: income },
          { title: "Expense", items: expense },
        ].map((group) => (
          <div key={group.title} className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-4">{group.title}</h3>
            <ul className="space-y-2">
              {group.items.length === 0 && <li className="text-sm text-muted-foreground">No categories yet.</li>}
              {group.items.map((c) => (
                <li key={c.id} className="group flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(PALETTE[0]);
  const qc = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("categories").insert({
      user_id: userRes.user!.id, name: name.trim(), type, color, icon: "Tag",
    });
    if (error) return toast.error(error.message);
    toast.success("Category added");
    qc.invalidateQueries({ queryKey: ["categories"] });
    setOpen(false); setName(""); setColor(PALETTE[0]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> New category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">New category</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="cname">Name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-background ${color === c ? "ring-2 ring-primary" : ""}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
