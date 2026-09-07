/** Static contact info only — no SupportTicket model was requested for
 * this module (models: RiderProfile, VehicleBooking, Trip, Job,
 * RiderEarning), so "contact support" is an honest static page rather
 * than a fabricated ticketing backend. See docs/rider.md.
 */
import Link from "next/link";

export default function RiderSupportPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Support</h1>
      <p className="mt-1 text-sm text-brand-900/60">Need help? Reach the Booklynk EV rider team.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5">
          <p className="text-sm font-medium text-brand-950">Email support</p>
          <p className="mt-1 text-sm text-brand-900/70">riders-support@booklynkev.example</p>
          <p className="mt-2 text-xs text-brand-900/50">Typical response time: within 24 hours.</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-5">
          <p className="text-sm font-medium text-brand-950">Phone support</p>
          <p className="mt-1 text-sm text-brand-900/70">+91 1800-000-0000</p>
          <p className="mt-2 text-xs text-brand-900/50">Available 8 AM – 8 PM IST, every day.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
        <p className="text-sm font-medium text-brand-950">Before you reach out</p>
        <ul className="mt-3 space-y-2 text-sm text-brand-900/70">
          <li>
            Vehicle issue? Check your{" "}
            <Link href="/rider/current-vehicle" className="font-medium text-brand-600 hover:text-brand-700">
              Current Vehicle
            </Link>{" "}
            page first.
          </li>
          <li>
            Payment question? Your full history is on the{" "}
            <Link href="/rider/payments" className="font-medium text-brand-600 hover:text-brand-700">
              Payments
            </Link>{" "}
            page.
          </li>
          <li>
            KYC stuck? See status and resubmit on the{" "}
            <Link href="/rider/kyc" className="font-medium text-brand-600 hover:text-brand-700">
              KYC
            </Link>{" "}
            page.
          </li>
        </ul>
      </div>
    </div>
  );
}
