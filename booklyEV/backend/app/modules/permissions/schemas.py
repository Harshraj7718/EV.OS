import uuid

from pydantic import BaseModel, ConfigDict

from app.modules.roles.enums import RoleName


class PermissionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    resource: str
    action: str
    code: str
    description: str


class RolePermissionMatrix(BaseModel):
    permissions: list[PermissionPublic]
    matrix: dict[RoleName, list[str]]  # role -> granted permission codes
