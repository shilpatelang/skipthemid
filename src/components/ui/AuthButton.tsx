"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { User, X, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="fixed top-8 right-8 z-50 h-12 w-12 animate-pulse rounded-full bg-white/10" />
    );
  }

  // --- Logged-in state ---
  if (session?.user) {
    const img = session.user.image;
    return (
      <div className="fixed top-8 right-8 z-50">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-colors hover:bg-white/15"
        >
          {img ? (
            <img
              src={img}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <User size={22} className="text-white" />
          )}
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-3 rounded-xl border border-white/15 bg-white/10 p-1.5 backdrop-blur-2xl">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="whitespace-nowrap rounded-lg px-5 py-2.5 text-base text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- Logged-out state ---
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="fixed top-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-colors hover:bg-white/15"
      >
        <User size={22} className="text-white" />
      </button>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Auth Modal
// ---------------------------------------------------------------------------

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setError("");
    setShowPassword(false);
  };

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      onClose();
    }
  };

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const loginRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (loginRes?.error) {
      setError("Account created but login failed. Please try logging in.");
      setMode("login");
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
      {/* backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 px-10 py-10 shadow-2xl backdrop-blur-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 transition-colors hover:text-white"
        >
          <X size={24} />
        </button>

        {/* Google */}
        <button
          onClick={() => signIn("google")}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-base font-medium text-white transition-colors hover:bg-white/15"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-sm uppercase tracking-widest text-gray-400">
            or
          </span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        {/* Form */}
        <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
          {mode === "register" && (
            <div className="mb-5 flex gap-4">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-1/2 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-gray-500 outline-none transition-colors focus:border-white/30"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-1/2 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-gray-500 outline-none transition-colors focus:border-white/30"
              />
            </div>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-5 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-gray-500 outline-none transition-colors focus:border-white/30"
          />

          <div className="relative mb-5">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-12 text-base text-white placeholder-gray-500 outline-none transition-colors focus:border-white/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="mb-5 text-base text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-700 px-5 py-4 text-base font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-8 text-center text-base text-gray-400">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  resetForm();
                  setMode("register");
                }}
                className="font-medium text-white hover:underline"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  resetForm();
                  setMode("login");
                }}
                className="font-medium text-white hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Google "G" icon (avoids an extra dependency)
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.001 24.001 0 0 0 0 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
