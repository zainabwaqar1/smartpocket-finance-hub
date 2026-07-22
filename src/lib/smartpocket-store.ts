import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

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

export type User = { id: string; email: string; firstName: string };

export type SPState = {
  user: User | null;
  budget: Budget | null;
  expenses: Expense[];
  loading: boolean; // true until the auth session + initial data are known
};

const defaultState: SPState = { user: null, budget: null, expenses: [], loading: true };

let state: SPState = defaultState;
const listeners = new Set<() => void>();

function setState(next: Partial<SPState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): SPState {
  return state;
}

function getServerSnapshot(): SPState {
  return defaultState;
}

export function useSP() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ---------- data loading ---------- */

let loadSeq = 0; // ignore stale fetches if a newer one started

async function loadUserData(userId: string) {
  const seq = ++loadSeq;
  try {
    const [budgetRes, expensesRes, profileRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (seq !== loadSeq) return; // a newer load superseded this one

    // if either request errored, retry rather than showing empty data
    if (budgetRes.error || expensesRes.error) {
      setTimeout(() => {
        if (seq === loadSeq) loadUserData(userId);
      }, 1500);
      return;
    }

    const budget: Budget | null = budgetRes.data
      ? {
          allowance: budgetRes.data.allowance,
          income: budgetRes.data.income,
          savingsGoal: budgetRes.data.savings_goal,
          type: budgetRes.data.type,
        }
      : null;

    const expenses: Expense[] = (expensesRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      category: r.category,
      date: r.date,
    }));

    const firstName = profileRes.data?.first_name ?? "";
    setState({
      budget,
      expenses,
      user: state.user ? { ...state.user, firstName } : state.user,
      loading: false,
    });
  } catch {
    // network failure — retry
    setTimeout(() => {
      if (seq === loadSeq) loadUserData(userId);
    }, 1500);
  }
}

/* ---------- session bootstrap (runs once on app start) ---------- */

let initialized = false;

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      // only reload data on real sign-in / initial session, not on every
      // token refresh (which fires periodically and caused data to blink)
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        setState({
          user: { id: session.user.id, email: session.user.email ?? "", firstName: state.user?.firstName ?? "" },
          loading: true,
        });
        loadUserData(session.user.id);
      } else {
        setState({ user: { id: session.user.id, email: session.user.email ?? "", firstName: state.user?.firstName ?? "" } });
      }
    } else {
      setState({ user: null, budget: null, expenses: [], loading: false });
    }
  });
}

init();

/* ---------- actions ---------- */

export const sp = {
  /** Returns null on success, or an error message to show the user. */
/** Returns null on success, or an error message to show the user. */
async signup(email: string, password: string, firstName: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return friendlyAuthError(error.message);
  // save the first name to the profiles table
  if (data.user) {
    await supabase.from("profiles").upsert({ user_id: data.user.id, first_name: firstName.trim() });
  }
  return null;
},

  /** Returns null on success, or an error message to show the user. */
  async login(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return friendlyAuthError(error.message);
    return null;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  /** Step 1 of reset: email the user a reset link. Returns null on success. */
  async requestPasswordReset(email: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/forgot-password",
    });
    if (error) return friendlyAuthError(error.message);
    return null;
  },

  /** Step 2: set the new password (works once the user arrives via the email link). */
  async updatePassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return friendlyAuthError(error.message);
    return null;
  },

  async setBudget(b: Budget): Promise<string | null> {
    if (!state.user) return "Not logged in";
    const { error } = await supabase.from("budgets").upsert({
      user_id: state.user.id,
      allowance: b.allowance,
      income: b.income,
      savings_goal: b.savingsGoal,
      type: b.type,
      updated_at: new Date().toISOString(),
    });
    if (error) return "Couldn't save budget. Check your connection and try again.";
    setState({ budget: b });
    return null;
  },

  async addExpense(e: Omit<Expense, "id">): Promise<string | null> {
    if (!state.user) return "Not logged in";
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: state.user.id,
        name: e.name,
        amount: e.amount,
        category: e.category,
        date: e.date,
      })
      .select()
      .single();
    if (error || !data) return "Couldn't save expense. Check your connection and try again.";
    const expense: Expense = {
      id: data.id,
      name: data.name,
      amount: data.amount,
      category: data.category,
      date: data.date,
    };
    setState({ expenses: [expense, ...state.expenses] });
    return null;
  },

  async removeExpense(id: string): Promise<string | null> {
    const prev = state.expenses;
    setState({ expenses: prev.filter((x) => x.id !== id) }); // optimistic
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      setState({ expenses: prev }); // roll back
      return "Couldn't delete expense. Try again.";
    }
    return null;
  },
};

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Invalid email or password.";
  if (m.includes("already registered")) return "This email is already registered. Try logging in.";
  if (m.includes("at least 6 characters")) return "Password must be at least 6 characters.";
  if (m.includes("valid email")) return "Please enter a valid email address.";
  if (m.includes("confirm")) return "Please confirm your email first (check your inbox).";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a bit and try again.";
  return msg;
}

/* ---------- derived helpers ---------- */

export function totalSpent(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function byCategory(expenses: Expense[]) {
  const map = new Map<Category, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return CATEGORIES.map((c) => ({ category: c, amount: map.get(c) ?? 0 })).filter((x) => x.amount > 0);
}

/** Start of the current budget period: calendar month for Monthly, current week (Sun–Sat) for Weekly. */
export function periodStart(type: "Weekly" | "Monthly", now = new Date()): Date {
  if (type === "Weekly") {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Expenses that fall within the current budget period. */
export function expensesInPeriod(expenses: Expense[], type: "Weekly" | "Monthly"): Expense[] {
  const start = periodStart(type);
  return expenses.filter((e) => new Date(e.date) >= start);
}

/** The user's budget amount: allowance + income − savings goal. */
export function budgetAmount(b: Budget | null): number {
  if (!b) return 0;
  return b.allowance + b.income - b.savingsGoal;
}

export function formatRs(n: number) {
  const sign = n < 0 ? "-" : "";
  return sign + "Rs. " + new Intl.NumberFormat("en-IN").format(Math.abs(Math.round(n)));
}