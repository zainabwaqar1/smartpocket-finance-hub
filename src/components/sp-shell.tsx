import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Menu, User2, X } from "lucide-react";
import { HelpAgent } from "@/components/help-agent";

export function SPShell({
  children,
  title,
  showBack = false,
  showProfile = false,
  onProfile,
  compactBottom = false,
}: {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showProfile?: boolean;
  onProfile?: () => void;
  compactBottom?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div
        className={`mx-auto flex min-h-screen max-w-md flex-col px-6 pt-6 ${compactBottom ? "pb-0" : "pb-24"}`}
      >
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <NavMenu />
            {showBack && (
              <button
                onClick={() => navigate({ to: "/" })}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary transition hover:bg-primary/10"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {title && (
              <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
                {title}
              </h1>
            )}
          </div>
          {showProfile && <ProfileMenu onLogout={onProfile} />}
        </header>
        <div className="flex-1">{children}</div>
      </div>
      <HelpAgent />
      <ToastHost />
    </div>
  );
}

/* Hamburger menu with animated slide-in navigation drawer */
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/breakdown", label: "Breakdown" },
  { to: "/history", label: "History" },
  { to: "/add-expense", label: "Add Expense" },
  { to: "/setup", label: "Set Budget" },
];

/* Toast — lightweight notification, call showToast("message") from anywhere.
   Messages are queued at module level so they survive page navigation. */
type ToastMsg = { id: number; text: string };
let pushToast: ((text: string) => void) | null = null;
const pendingToasts: string[] = [];

export function showToast(text: string) {
  if (pushToast) {
    pushToast(text);
  } else {
    pendingToasts.push(text);
  }
}

function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    pushToast = (text: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
    };
    // show anything that was queued while no host was mounted (e.g. during navigation)
    while (pendingToasts.length) {
      pushToast(pendingToasts.shift()!);
    }
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

function NavMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false); // drawer is in the DOM
  const [visible, setVisible] = useState(false); // drawer is slid in

  function openMenu() {
    setMounted(true);
    // wait a frame so the browser paints the off-screen position first, then slide in
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }

  function closeMenu() {
    setVisible(false);
    // remove from DOM after the slide-out animation finishes
    setTimeout(() => setMounted(false), 300);
  }

  // prevent background scrolling while drawer is open
  useEffect(() => {
    document.body.style.overflow = mounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  // no hamburger on the login screen (placed after all hooks)
  if (pathname === "/login" || pathname === "/forgot-password") return null;

  return (
    <>
      <button
        onClick={openMenu}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary transition hover:bg-primary/10"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mounted && (
        <div className="fixed inset-0 z-50">
          {/* dark overlay — fades in/out, click to close */}
          <div
            className={
              "absolute inset-0 bg-foreground/40 transition-opacity duration-300 " +
              (visible ? "opacity-100" : "opacity-0")
            }
            onClick={closeMenu}
          />
          {/* drawer — slides in/out */}
          <div
            className={
              "absolute left-0 top-0 flex h-full w-64 flex-col bg-background p-6 shadow-2xl transition-transform duration-300 ease-out " +
              (visible ? "translate-x-0" : "-translate-x-full")
            }
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xl font-extrabold text-primary">SmartPocket</span>
              <button
                onClick={closeMenu}
                className="grid h-9 w-9 place-items-center rounded-full text-primary transition hover:bg-primary/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-base font-bold text-foreground transition hover:bg-primary/10 [&.active]:bg-primary/10 [&.active]:text-primary"
                  activeProps={{ className: "active" }}
                  activeOptions={{ exact: l.to === "/" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

/* profile icon with dropdown menu (Add photo / Logout) */
const PHOTO_KEY = "sp-profile-photo";

export function ProfileMenu({ onLogout }: { onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhoto(localStorage.getItem(PHOTO_KEY));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - min) / 2,
          (img.height - min) / 2,
          min,
          min,
          0,
          0,
          size,
          size
        );
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        localStorage.setItem(PHOTO_KEY, dataUrl);
        setPhoto(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-foreground text-background"
        aria-label="Profile"
      >
        {photo ? (
          <img src={photo} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User2 className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-primary/10"
          >
            {photo ? "Change photo" : "Add photo"}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            Logout
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={pickPhoto}
      />
    </div>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2 text-xs font-semibold">
        <NavItem to="/" label="Home" />
        <NavItem to="/breakdown" label="Breakdown" />
        <NavItem to="/history" label="History" />
        <NavItem to="/add-expense" label="Add" />
      </div>
    </nav>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex-1 rounded-lg px-2 py-2 text-center text-muted-foreground transition [&.active]:text-primary"
      activeProps={{ className: "active" }}
      activeOptions={{ exact: to === "/" }}
    >
      {label}
    </Link>
  );
}

export function Field({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-full border-2 border-primary/60 bg-card px-5 py-3 text-base font-medium text-foreground outline-none transition placeholder:text-primary/60 focus:border-primary " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-60 " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-full border-2 border-primary bg-card px-6 py-4 text-base font-bold text-primary transition active:scale-[0.98] " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}