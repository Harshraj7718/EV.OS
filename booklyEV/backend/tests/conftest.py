import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_token, hash_password
from app.main import app

# Import every module's models so Base.metadata is complete before create_all.
from app.modules.audit import models as _audit_models  # noqa: F401
from app.modules.auth import models as _auth_models  # noqa: F401
from app.modules.businesses import models as _businesses_models  # noqa: F401
from app.modules.investors import models as _investors_models  # noqa: F401
from app.modules.permissions import models as _permissions_models  # noqa: F401
from app.modules.permissions.seed import seed_permissions, seed_role_permissions
from app.modules.riders import models as _riders_models  # noqa: F401
from app.modules.roles import models as _roles_models  # noqa: F401
from app.modules.roles.enums import RoleName
from app.modules.roles.repository import RoleRepository
from app.modules.roles.seed import seed_roles
from app.modules.users import models as _users_models  # noqa: F401
from app.modules.users.enums import UserStatus
from app.modules.users.models import User

_DB_NAME_SUFFIX = "_test"
TEST_PASSWORD = "Passw0rd123"


def _test_database_url() -> str:
    base_url, _, db_name = settings.DATABASE_URL.rpartition("/")
    return f"{base_url}/{db_name}{_DB_NAME_SUFFIX}"


def _admin_database_url() -> str:
    base_url, _, _ = settings.DATABASE_URL.rpartition("/")
    return f"{base_url}/postgres"


def _ensure_test_database_exists(db_name: str) -> None:
    admin_engine = create_engine(_admin_database_url(), isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}
            ).first()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        admin_engine.dispose()


@pytest.fixture(scope="session")
def engine():
    test_url = _test_database_url()
    db_name = test_url.rsplit("/", 1)[1]
    _ensure_test_database_exists(db_name)

    eng = create_engine(test_url, future=True)
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db_session(engine) -> Session:
    """One test = one outer transaction, rolled back at the end.

    Application code calls `session.commit()` freely (it must, to mirror
    production); `join_transaction_mode="create_savepoint"` makes those
    commits release/recreate a SAVEPOINT instead of the real transaction,
    so nothing a test does ever persists past it.
    """
    connection = engine.connect()
    outer_transaction = connection.begin()
    testing_session_local = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        future=True,
        join_transaction_mode="create_savepoint",
    )
    session = testing_session_local()

    seed_roles(session)
    seed_permissions(session)
    seed_role_permissions(session)

    yield session

    session.close()
    outer_transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_user_with_role(
    db_session: Session,
    role_name: RoleName,
    *,
    email: str,
    phone: str,
    status: UserStatus = UserStatus.ACTIVE,
) -> User:
    """Create a User with an arbitrary role directly in the DB.

    Public registration can only ever produce RIDER — this bypasses that
    (as only server-side/internal tooling should be able to) so tests can
    exercise every role.
    """
    role = RoleRepository(db_session).get_by_name(role_name)
    assert role is not None, f"Role {role_name} was not seeded"

    user = User(
        name=f"Test {role_name.value.title()}",
        email=email,
        phone=phone,
        password_hash=hash_password(TEST_PASSWORD),
        role_id=role.id,
        status=status,
        is_verified=True,
    )
    db_session.add(user)
    db_session.flush()
    user.role = role
    return user


def issue_access_token(user: User) -> str:
    """A real, correctly-signed access token — bypasses login so tests
    don't need to know a plaintext password for every role fixture.
    """
    return create_token(subject=str(user.id), token_type="access")
