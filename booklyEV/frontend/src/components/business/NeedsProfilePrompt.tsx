import Link from "next/link";

/** Every /business/* page except Profile itself depends on a
 * BusinessProfile existing — the backend 404s "Business profile not
 * found" for any of them until one is created. Shown instead of a raw
 * error so a brand-new business has an obvious next step. */
export function NeedsProfilePrompt() {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
      <h3 className="text-lg font-semibold text-brand-950">Create your business profile</h3>
      <p className="mt-2 text-sm text-brand-900/60">
        You need a business profile before you can create fleets, add vehicles, or recruit riders.
      </p>
      <Link
        href="/business/profile"
        className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Set up profile
      </Link>
    </div>
  );
}
