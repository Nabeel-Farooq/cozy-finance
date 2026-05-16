import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  occurred_on: string;
  created_at: string;
};

export type Budget = {
  id: string;
  category_id: string;
  amount: number;
  month: string;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
    },
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("*");
      if (error) throw error;
      return (data as Budget[]).map((b) => ({ ...b, amount: Number(b.amount) }));
    },
  });
}
