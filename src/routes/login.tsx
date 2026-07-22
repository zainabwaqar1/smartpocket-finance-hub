import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { sp, useSP } from "@/lib/smartpocket-store";
import { Field, PrimaryButton, SPShell, TextInput } from "@/components/sp-shell";
import studentsIllustration from "@/assets/login-students.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — SmartPocket" },
      { name: "description", content: "Sign in to SmartPocket to track your spending and save smarter." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const state = useSP();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [firstName, setFirstName] = useState("");

  // Once a session exists and data has loaded, leave the login page
  useEffect(() => {
    if (state.user && !state.loading) {
      navigate({ to: state.budget ? "/" : "/setup" });
    }
  }, [state.user, state.loading, state.budget, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    if (mode === "signup" && !firstName.trim()) {
      setBusy(false);
      setError("Please enter your first name.");
      return;
    }
    const err =
      mode === "login"
        ? await sp.login(email.trim(), password)
        : await sp.signup(email.trim(), password, firstName);
    setBusy(false);
    if (err) setError(err);
    // on success, the useEffect above navigates once the session lands
  }

  return (
    <SPShell compactBottom>
      <div className="grid min-h-[calc(100dvh-1.5rem)] grid-rows-[auto_auto_1fr_auto] pt-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">SmartPocket</h1>
          <p className="mt-2 text-base font-semibold italic text-muted-foreground">
            Track your spending. Save smarter.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-center text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

{mode === "signup" && (
            <Field label="">
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={30}
                autoComplete="given-name"
              />
            </Field>
          )}
          <Field label="">
            <TextInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="">
            <div className="relative">
              <TextInput
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </Field>
          {/* NEW — forgot password link (only shown in login mode) */}
          {mode === "login" && (
            <Link
              to="/forgot-password"
              className="text-center text-sm font-semibold text-primary/80 underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          )}
          <div className="px-6 pt-4">
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Login" : "Sign Up"}
            </PrimaryButton>
          </div>
          <button
            type="button"
            className="text-center text-sm font-semibold text-primary/80 underline-offset-4 hover:underline"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "login" ? "signup" : "login"));
            }}
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
          </button>
        </form>

        <div aria-hidden />

        <div className="-mx-6 self-end">
          <img
            src={studentsIllustration}
            alt="Students using SmartPocket"
            width={1200}
            height={700}
            
            draggable={false}
          />
        </div>
      </div>
    </SPShell>
  );
}