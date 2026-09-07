import uuid

from pydantic import BaseModel, ConfigDict

from app.modules.roles.enums import RoleName


class RolePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: RoleName
