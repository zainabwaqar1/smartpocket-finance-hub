import { useSyncExternalStore } from "react";

export type Category = "Food" | "Travel" | "Shopping" | "Entertainment" | "Mobile" | "Miscellaneous";

export const CATEGORIES: Category[] = ["Food", "Travel", "Shopping", "Entertainment", "Mobile", "Miscellaneous"];

export const CATEGORY_EMOJI: Record<Category, string> = {
  Food: "🍔",
  Travel: "🚌",
  Shopping: "🛍️",
  Entertainment: "🎮",
  Mobile: "📱",
  Miscellaneous: "📦",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  Food: "var(--color-chart-1)",
  Travel: "var(--color-chart-2)",
  Shopping: "var(--color-chart-3)",
  Entertainment: "var(--color-chart-4)",
  Mobile: "var(--color-chart-5)",
  Miscellaneous: "var(--color-chart-6)",
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: string; // ISO
};

export type Budget = {
  allowance: number;
  income: number;
  savingsGoal: number;
  type: "Weekly" | "Monthly";
};

export type User = { email: string };

export type SPState = {
  user: User | null;
  budget: Budget | null;
  expenses: Expense[];
};

const KEY = "smartpocket-state-v1";

const defaultState: SPState = { user: null, budget: null, expenses: [] };

function read(): SPState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...(JSON.parse(raw) as SPState) };
  } catch {
    return defaultState;
  }
}

let state: SPState = defaultState;
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    state = read();
    hydrated = true;
  }
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
}

function setState(next: Partial<SPState>) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  ensureHydrated();
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): SPState {
  ensureHydrated();
  return state;
}

function getServerSnapshot(): SPState {
  return defaultState;
}

export function useSP() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const sp = {
  login(email: string) {
    setState({ user: { email } });
  },
  logout() {
    setState({ user: null });
  },
  setBudget(b: Budget) {
    setState({ budget: b });
  },
  addExpense(e: Omit<Expense, "id">) {
    ensureHydrated();
    const expense: Expense = { ...e, id: crypto.randomUUID() };
    setState({ expenses: [expense, ...state.expenses] });
  },
  removeExpense(id: string) {
    ensureHydrated();
    setState({ expenses: state.expenses.filter((x) => x.id !== id) });
  },
  reset() {
    setState(defaultState);
  },
};

// Derived helpers
export function totalSpent(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function byCategory(expenses: Expense[]) {
  const map = new Map<Category, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return CATEGORIES.map((c) => ({ category: c, amount: map.get(c) ?? 0 })).filter((x) => x.amount > 0);
}

export function monthlyBudget(b: Budget | null) {
  if (!b) return 0;
  return b.allowance + b.income;
}

export function formatRs(n: number) {
  return "Rs. " + new Intl.NumberFormat("en-IN").format(Math.round(n));
}
