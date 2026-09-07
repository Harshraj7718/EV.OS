import enum


class RoleName(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    INVESTOR = "INVESTOR"
    RIDER = "RIDER"
    BUSINESS = "BUSINESS"


# The only role a public /api/auth/register call may end up with.
# ADMIN and SUPER_ADMIN are never assignable through public registration.
DEFAULT_SELF_SIGNUP_ROLE = RoleName.RIDER
