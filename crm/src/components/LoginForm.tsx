"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
        <input
          name="password"
          type="password"
          autoFocus
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full justify-center">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
