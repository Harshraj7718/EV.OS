"""Seed the fixed permission catalog and the role → permission matrix.

Idempotent — safe to run on every deploy. Permissions and role/permission
links are not user-manageable data: this file (plus
`app/modules/roles/seed.py` for the roles themselves) is the only place
they're defined. See docs/authorization.md for the human-readable matrix
and the reasoning behind who gets what.
"""
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.modules.permissions.models import Permission
from app.modules.permissions.repository import PermissionRepository
from app.modules.roles.enums import RoleName
from app.modules.roles.repository import RoleRepository

# (resource, action, description) — code is derived as f"{resource}.{action}".
PERMISSION_DEFINITIONS: list[tuple[str, str, str]] = [
    ("user", "read", "View user accounts"),
    ("user", "create", "Create user accounts"),
    ("user", "update", "Update user accounts"),
    ("user", "suspend", "Suspend a user account"),
    ("vehicle", "read", "View vehicles"),
    ("vehicle", "create", "Add a vehicle to the catalog"),
    ("vehicle", "update", "Update vehicle details"),
    ("vehicle", "book", "Book a vehicle"),
    ("fleet", "read", "View fleets"),
    ("fleet", "create", "Create a fleet"),
    ("fleet", "update", "Update fleet details"),
    ("investment", "read", "View investments"),
    ("investment", "create", "Create an investment"),
    ("trip", "read", "View trips"),
    ("trip", "create", "Create/start a trip"),
    ("trip", "update", "Update a trip"),
    ("payment", "read", "View payments"),
    ("payment", "create", "Create a payment"),
    ("analytics", "read", "View analytics dashboards"),
    ("kyc", "read", "View KYC status"),
    ("kyc", "submit", "Submit KYC documents"),
    ("kyc", "verify", "Verify a KYC submission"),
]

ALL_PERMISSION_CODES = [f"{resource}.{action}" for resource, action, _ in PERMISSION_DEFINITIONS]

# Role → permission codes. SUPER_ADMIN implicitly gets every permission
# (see below) rather than repeating the full list here.
ROLE_PERMISSIONS: dict[RoleName, list[str]] = {
    # ADMIN is a scoped internal-operations role — view/update/suspend,
    # never create/activate/assign-role/manage-RBAC. See docs/admin.md
    # ("ADMIN operational role") for the full rationale; this list is
    # intentionally narrower than the original ADMIN grant set.
    RoleName.ADMIN: [
        "user.read",
        "user.update",
        "user.suspend",
        "vehicle.read",
        "vehicle.update",
        "fleet.read",
        "trip.read",
        "trip.update",
        "payment.read",
        "analytics.read",
        "kyc.read",
        "kyc.verify",
    ],
    RoleName.INVESTOR: [
        "investment.read",
        "investment.create",
        "vehicle.read",
        "fleet.read",
        "trip.read",
        "analytics.read",
        "payment.read",
        "payment.create",
        "kyc.read",
        "kyc.submit",
    ],
    RoleName.RIDER: [
        "vehicle.read",
        "vehicle.book",
        "trip.read",
        "trip.create",
        "trip.update",
        "payment.read",
        "payment.create",
        "kyc.read",
        "kyc.submit",
    ],
    RoleName.BUSINESS: [
        "fleet.read",
        "fleet.create",
        "fleet.update",
        "vehicle.read",
        "vehicle.create",
        "vehicle.update",
        "trip.read",
        "trip.create",
        "trip.update",
        "analytics.read",
        "payment.read",
        "payment.create",
        "kyc.read",
        "kyc.submit",
        "user.read",
    ],
}


def seed_permissions(db: Session) -> None:
    repo = PermissionRepository(db)
    created = 0
    for resource, action, description in PERMISSION_DEFINITIONS:
        code = f"{resource}.{action}"
        if repo.get_by_code(code) is not None:
            continue
        db.add(Permission(resource=resource, action=action, code=code, description=description))
        created += 1
    db.commit()
    total = len(PERMISSION_DEFINITIONS)
    already_present = total - created
    logger.info(
        "Permission seed complete: %d created, %d already present", created, already_present
    )


def seed_role_permissions(db: Session) -> None:
    """Sync (not just add): each role's links are made to match
    ROLE_PERMISSIONS exactly — grants missing links AND revokes ones no
    longer listed. This is what let ADMIN's permission set shrink when it
    was tightened (see docs/admin.md) instead of the old grants lingering
    forever.

    Trade-off: any runtime grant/revoke SUPER_ADMIN made via
    `/api/admin/rbac/...` that isn't reflected here gets reset the next
    time this is run (e.g. on redeploy). If that's ever undesired, treat
    ROLE_PERMISSIONS as the thing to update, not the running database.
    """
    role_repo = RoleRepository(db)
    permission_repo = PermissionRepository(db)
    linked = 0
    unlinked = 0

    for role_name in RoleName:
        role = role_repo.get_by_name(role_name)
        if role is None:
            raise RuntimeError(f"Role '{role_name.value}' is not seeded. Run seed_roles() first.")

        if role_name == RoleName.SUPER_ADMIN:
            desired_codes = set(ALL_PERMISSION_CODES)
        else:
            desired_codes = set(ROLE_PERMISSIONS.get(role_name, []))

        current_codes = permission_repo.list_codes_for_role(role.id)

        for code in desired_codes - current_codes:
            permission = permission_repo.get_by_code(code)
            if permission is None:
                raise RuntimeError(
                    f"Permission '{code}' is not seeded. Run seed_permissions() first."
                )
            permission_repo.link(role.id, permission.id)
            linked += 1

        for code in current_codes - desired_codes:
            permission = permission_repo.get_by_code(code)
            if permission is not None:
                permission_repo.unlink(role.id, permission.id)
                unlinked += 1

    db.commit()
    logger.info(
        "Role-permission sync complete: %d links created, %d links removed", linked, unlinked
    )
