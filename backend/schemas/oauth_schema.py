from pydantic import BaseModel
from models.user import User

class GoogleProfile(BaseModel):
    sub: str
    email: str
    given_name: str | None = None
    family_name: str | None = None
    name: str | None = None
    picture: str | None = None

    @property
    def oauth_id(self) -> str:
        return f"GOOGLE_{self.sub}"

    def to_orm(self) -> User:
        first_name = self.given_name or self.name or ""
        return User(
            email=self.email,
            oauth_id=self.oauth_id,
            first_name=first_name,
            last_name=self.family_name or "",
            picture=self.picture
        )

    def update_orm(self, user: User) -> User:
        user.oauth_id = self.oauth_id
        if self.picture:
            user.picture = self.picture
        if self.given_name or self.name:
            user.first_name = self.given_name or self.name
        if self.family_name:
            user.last_name = self.family_name
        return user


class GitHubProfile(BaseModel):
    id: int
    login: str
    email: str | None = None
    name: str | None = None
    avatar_url: str | None = None

    @property
    def oauth_id(self) -> str:
        return f"GITHUB_{self.id}"

    def _parse_names(self) -> tuple[str, str]:
        full_name = self.name or self.login or ""
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        return first_name, last_name

    def to_orm(self) -> User:
        first_name, last_name = self._parse_names()
        return User(
            email=self.email,
            oauth_id=self.oauth_id,
            first_name=first_name,
            last_name=last_name,
            picture=self.avatar_url
        )

    def update_orm(self, user: User) -> User:
        first_name, last_name = self._parse_names()
        user.oauth_id = self.oauth_id
        if self.avatar_url:
            user.picture = self.avatar_url
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        return user