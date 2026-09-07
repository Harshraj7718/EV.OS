import Link from "next/link";

/** Every /investor/* page except Profile itself depends on an
 * InvestorProfile existing — the backend 404s "Investor profile not
 * found" for any of them until one is created. Shown instead of a raw
 * error so a brand-new investor has an obvious next step. */
export function NeedsProfilePrompt() {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
      <h3 className="text-lg font-semibold text-brand-950">Create your investor profile</h3>
      <p className="mt-2 text-sm text-brand-900/60">
        You need an investor profile before you can invest, track earnings, or request payouts.
      </p>
      <Link
        href="/investor/profile"
        className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Set up profile
      </Link>
    </div>
  );
}
