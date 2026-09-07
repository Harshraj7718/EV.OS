# Investor Module

Implemented by `app/modules/investors/` (backend) and
`frontend/src/app/investor/` (frontend). Business proposition: **passive
income** — an INVESTOR creates a profile, completes KYC, browses EV
investment opportunities, invests, and tracks the assets, earnings, and
payouts that result.

## Scope

Real backing data model, no placeholders: `InvestorProfile`, `EVAsset`,
`Investment`, `InvestorEarning`, `Payout`, `Transaction`, `KycDocument` —
7 tables (see [database.md](database.md)). No real payment gateway is
connected; investing and requesting a payout both settle synchronously in
a clearly-marked development/mock state (see "Mock settlement" below).

## Ownership isolation: the core requirement

**Investor A must never access Investor B's data**, and the frontend must
never be trusted to enforce that. Three structural choices make this true
by construction rather than by convention:

1. **Every repository method scoped to an investor takes
   `investor_profile_id` as a required parameter** — not optional, not
   inferred. `app/modules/investors/repository.py` has no method capable
   of returning another investor's row even by mistake; there's no code
   path that queries `Investment`/`InvestorEarning`/`Payout`/
   `TransactionModel`/`KycDocument` without that filter.
2. **`InvestorService.get_profile_for_user(user)` is the only way any
   service method learns "which investor"** — it resolves the profile
   from the authenticated `User` (itself resolved from the JWT by
   `get_current_user`, never from client input). No service method
   accepts an `investor_id`/`user_id` parameter from a caller.
3. **A single-record ownership gate returns `None` for both "not found"
   and "not yours"** — `InvestmentRepository.get_owned(investment_id,
   investor_profile_id)` filters on both columns in one query, so
   `GET /api/investor/investments/{id}` 404s identically whether the id
   doesn't exist or belongs to someone else. This prevents IDOR
   enumeration: an attacker handed a real id belonging to another
   investor can't distinguish "wrong id" from "not mine."

**Do not trust `user_id`/`investor_id`/`asset_id` from the client** is
implemented exactly this way: `user_id` is never read from a request body
at all (only from the verified JWT); no route has an `investor_id` path
or query parameter, ever, for anything (contrast with `/api/admin/*`,
which does use path ids because an admin *is* meant to reach other
users' data); `ev_asset_id` in `POST /investments` is looked up and its
*current* `status` re-checked server-side — the client's view of
"available" a moment ago is never trusted.

**Investor cannot change asset ownership / payout records / investment
ownership**: no endpoint accepts an owner, a payout status, or an
investment's investor on any request. `EVAsset.owner_investor_profile_id`
is set in exactly one place in the whole codebase —
`InvestorService.invest()`, for the authenticated caller's own profile,
on successful (mock) settlement. `Payout.status` is likewise only ever
written by `InvestorService.request_payout()` itself.

## Mock settlement (no real payment gateway)

`invest()` and `request_payout()` both simulate settlement synchronously
and unconditionally — a real integration would leave the record `PENDING`
until an async webhook confirms it, but that would make the module
un-exercisable end-to-end without a real gateway. Every place this
happens is commented `# --- MOCK ... settlement ---` in `service.py`, and
`Payout.payout_method` defaults to the literal `"MOCK_BANK_TRANSFER"` so
it's visible in the data itself, not just the code.

**Earnings are system-generated, never investor-triggered.**
`InvestorService.accrue_earning_dev()` is not exposed via any API
endpoint — letting an investor call an "add earning" endpoint would let
them fabricate their own income. It's callable only from
`app/modules/investors/dev_seed.py` (`python -m
app.modules.investors.dev_seed`), a dev-only script that simulates one
month's accrual for every `ACTIVE` investment, using each asset's
`expected_monthly_return`. Not wired into `app/seed.py` — unlike
roles/permissions/EV-asset baseline data, it depends on real investments
already existing.

## KYC is not hard-gated on investing (deliberate scope decision)

There is no admin endpoint yet to move `kyc_status` to `VERIFIED` (KYC
verification is an ADMIN-side capability that doesn't exist for this
module yet). Rather than block `invest()` on a status nothing can ever
set to `VERIFIED`, KYC status is tracked and surfaced (`NOT_STARTED` →
`PENDING` on first document submission → `VERIFIED`/`REJECTED` once a
verifier exists) but does **not** gate investing in this phase. This
keeps the core investor flow fully testable end-to-end without expanding
scope into the admin module.

## API (`/api/investor/*`)

Every route uses `require_role(RoleName.INVESTOR)` — role-gated, not
permission-gated, deliberately: several relevant RBAC permission codes
(`payment.read`, `kyc.read`, `kyc.submit`) are also held by RIDER, and
permission-gating would let a RIDER account reach this module. Role-
gating closes that off entirely, matching "investor cannot access
Rider/Business/Admin dashboards" understood the other way around too.

| Method | Path | Notes |
|---|---|---|
| POST | `/profile` | Create; 409 if one already exists for this user |
| GET | `/profile` | 404 if none yet |
| PATCH | `/profile` | Partial update |
| POST | `/kyc/documents` | Records metadata only — no real file storage; bumps `kyc_status` to `PENDING` if it was `NOT_STARTED` |
| GET | `/kyc/documents` | Paginated, own documents only |
| GET | `/opportunities` | `EVAsset`s with `status=AVAILABLE`, not investor-scoped (shared browse list) |
| GET | `/assets` | EV assets owned by the caller |
| POST | `/investments` | Body is just `{ev_asset_id}` — amount is always the asset's price, server-derived, never client-supplied; 404 unknown asset, 409 not available |
| GET | `/investments` | Own investments, paginated |
| GET | `/investments/{id}` | Ownership-gated — 404 for someone else's id |
| GET | `/portfolio` | `total_invested`, `assets_owned`, `total_earnings`, `total_earnings_paid`, `unpaid_earnings_balance`, `total_payouts`, `roi_percent` |
| GET | `/earnings` | Own earnings, paginated |
| POST | `/payouts` | Pays out all currently-`ACCRUED` earnings; 400 if none |
| GET | `/payouts` | Own payouts, paginated |
| GET | `/transactions` | Own ledger (investments, earning credits, payouts), paginated |

## Financial calculations: isolated and pure

`app/modules/investors/finance.py` has zero DB/HTTP/ORM imports —
`round_money`, `calculate_roi_percent`, `sum_unpaid_earnings`, and
`summarize_portfolio` (returning a frozen `PortfolioTotals` dataclass) are
plain functions over `Decimal`, tested directly with no fixtures in
`tests/test_investor_finance.py`. `Decimal` is used throughout (never
`float`), rounded with `ROUND_HALF_UP` to 2 places. Money fields
therefore serialize as JSON **strings** (e.g. `"1200000.00"`), not
numbers — the frontend never parses them for arithmetic, only for
display (`lib/investor/api.ts`'s `formatCurrency`/`formatPercent`).

## Frontend

`app/investor/layout.tsx` wraps every `/investor/*` page in
`<ProtectedRoute roles={["INVESTOR"]}>` once — a UX convenience; the real
boundary is the backend's `require_role` on every call. `/investor`
itself redirects to `/investor/dashboard`.

| Page | Backend calls |
|---|---|
| `/investor/dashboard` | profile + portfolio snapshot, KYC status, quick links |
| `/investor/investments` | opportunities (browse + invest) and own investment history in one page |
| `/investor/assets` | owned EV assets |
| `/investor/portfolio` | full `PortfolioSummary` |
| `/investor/earnings` | earnings table |
| `/investor/transactions` | full ledger |
| `/investor/payouts` | payout history + "Request payout" action |
| `/investor/kyc` | current KYC status + submit-document form |
| `/investor/documents` | read-only table of all submitted KYC documents |
| `/investor/profile` | create (if none) or view/edit |

Every page except Profile depends on a profile existing (the backend
404s "Investor profile not found" otherwise); on that specific 404 they
render `<NeedsProfilePrompt>` instead of a raw error, linking to
`/investor/profile`.

`lib/investor/` mirrors the `lib/admin/` pattern (`types.ts` mirroring
the backend schemas 1:1, `api.ts` wrapping every endpoint through the
shared `apiClient`) but is kept self-contained rather than importing from
`lib/admin/`, matching this module's own ownership-isolation ethos.
Tables/pagination/status pills reuse the existing generic
`components/admin/{DataTable,Pagination,StatusBadge}` — those components
have no admin-specific logic, so reusing them isn't a layering violation.

### A real bug this surfaced

`app/modules/investors/dev_seed.py`, run standalone
(`python -m app.modules.investors.dev_seed`, not via `app.main`), only
imported its own module's models plus `Investment`/`InvestorEarning`.
SQLAlchemy configures its entire mapper registry together on first query,
not per-class — so the first `select(Investment)` failed with
`InvalidRequestError: ... failed to locate a name ('Role')`, because
`User.role` references `Role` by string and nothing had imported the
`roles` module. Fixed by importing every module's `models` (mirroring
`alembic/env.py` and `tests/conftest.py`'s existing pattern) at the top
of `dev_seed.py`.

## Testing

- **`backend/tests/test_investor_finance.py`** (9 tests) — pure unit
  tests of `finance.py`, no DB/fixtures: rounding, ROI (including
  zero-invested and >100% cases), portfolio summarization.
- **`backend/tests/test_investor.py`** (23 tests) — every endpoint;
  profile create/conflict/404/update; KYC submit + status transition;
  opportunities/investing (success, already-allocated 409, unknown-asset
  404, amount is server-derived not client-supplied); portfolio accuracy;
  payout request (success, nothing-to-pay-out 400, double-request 400);
  non-INVESTOR roles (SUPER_ADMIN/ADMIN/RIDER/BUSINESS) denied 403;
  unauthenticated 401; and, explicitly, **ownership isolation**: Investor
  B given Investor A's real investment id gets 404 (not a permissions
  error — indistinguishable from a wrong id); B's investments/earnings/
  payouts/transactions lists never include A's rows while A's own lists
  still do (isolation is scoped, not global breakage); an asset A already
  owns can't be invested in — and thus not reassigned — by B.

Verified live in the browser against the real backend: created a profile,
invested in an EV asset (opportunity disappeared from the browse list,
appeared in "My investments" and "My EV Assets"), ran `dev_seed` to
accrue an earning, requested a payout (earnings marked `PAID`, ledger
entry created), submitted a KYC document (status moved to `PENDING`,
visible on the Documents page), edited the profile; confirmed a RIDER
account hitting `/investor/dashboard` gets the frontend's "Access denied"
state; confirmed a second INVESTOR account with no investments sees none
of the first investor's data. All demo/test accounts and data created
during this verification were deleted afterward.
