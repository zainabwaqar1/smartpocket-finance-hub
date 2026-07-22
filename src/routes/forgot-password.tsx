import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { sp } from "@/lib/smartpocket-store";
import { supabase } from "@/lib/supabase";
import { Field, PrimaryButton, SPShell, TextInput, showToast } from "@/components/sp-shell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — SmartPocket" },
      { name: "description", content: "Reset your SmartPocket password." },
    ],
  }),
  component: ForgotPasswordPage,
});

type Step = "email" | "sent" | "password";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // When the user arrives via the email link, Supabase fires a PASSWORD_RECOVERY
  // event (it reads the token from the URL automatically). Switch to the
  // new-password step when that happens.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("password");
        setError(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setBusy(true);
    const err = await sp.requestPasswordReset(email.trim());
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setStep("sent");
  }

  async function saveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const err = await sp.updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    showToast("Password updated ✅");
    // the recovery link signed the user in, so go straight to the app
    navigate({ to: "/" });
  }

  return (
    <SPShell compactBottom>
      <div className="pt-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Reset Password</h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {step === "email" && "Enter your email and we'll send you a reset link."}
            {step === "sent" && `We sent a reset link to ${email}. Open it on this device.`}
            {step === "password" && "Link verified! Choose a new password."}
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-2xl bg-destructive/10 px-4 py-3 text-center text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        {step === "email" && (
          <form onSubmit={sendLink} className="mt-8 flex flex-col gap-4">
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
            <div className="px-6 pt-4">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send Reset Link"}
              </PrimaryButton>
            </div>
          </form>
        )}

        {step === "sent" && (
          <div className="mt-8 flex flex-col gap-4 text-center">
            <p className="rounded-2xl bg-primary/10 px-4 py-5 text-sm font-semibold text-primary">
              📧 Check your inbox (and spam folder). Clicking the link will bring
              you back here to set a new password.
            </p>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-sm font-semibold text-primary/80 underline-offset-4 hover:underline"
            >
              Didn't get it? Re-enter your email
            </button>
          </div>
        )}

        {step === "password" && (
          <form onSubmit={saveNewPassword} className="mt-8 flex flex-col gap-4">
            <Field label="">
              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
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
            <div className="px-6 pt-4">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save New Password"}
              </PrimaryButton>
            </div>
          </form>
        )}

        <p className="mt-8 text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-primary/80 underline-offset-4 hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </SPShell>
  );
}
