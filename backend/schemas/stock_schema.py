from pydantic import BaseModel, ConfigDict


class StockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stock_id: int
    ticker: str
    company_name: str | None
    description: str | None
    sector: str | None
    industry: str | None
    country: str | None
    currency: str | None
    website: str | None
