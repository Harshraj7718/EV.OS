"use client";

import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import { ROLES, type Role } from "@/lib/auth/types";

interface CreateUserFormProps {
  onCreated: () => void;
}

// Unlike public /register (always RIDER), a SUPER_ADMIN can create a user
// with any role here — including another ADMIN or SUPER_ADMIN.
export function CreateUserForm({ onCreated }: CreateUserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("RIDER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.createUser({ name, email, phone, password, role });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-3 rounded-2xl border border-brand-100 bg-white p-5 sm:grid-cols-2"
    >
      <input
        required
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-brand-100 px-3 py-2 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-brand-100 px-3 py-2 text-sm"
      />
      <input
        required
        placeholder="+919876543210"
        pattern="^\+[1-9]\d{7,14}$"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-lg border border-brand-100 px-3 py-2 text-sm"
      />
      <input
        required
        type="password"
        minLength={8}
        placeholder="Temporary password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-brand-100 px-3 py-2 text-sm"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="rounded-lg border border-brand-100 px-3 py-2 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create user"}
      </button>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </form>
  );
}
