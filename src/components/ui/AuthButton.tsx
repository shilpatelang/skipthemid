"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">{session.user.name}</span>
        <button
          onClick={() => signOut()}
          className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
    >
      Sign in
    </button>
  );
}
