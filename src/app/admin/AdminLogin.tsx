"use client";

import { useActionState } from "react";
import { loginAdmin } from "./actions";

export function AdminLogin() {
  const [state, action, pending] = useActionState<{ error?: boolean }, FormData>(loginAdmin, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="label">Admin PIN</span>
        <input className="field" name="pin" type="password" autoComplete="current-password" required />
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-danger">Wrong PIN</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Checking…" : "Open"}
      </button>
    </form>
  );
}
