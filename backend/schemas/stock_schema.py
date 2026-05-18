from pydantic import BaseModel, ConfigDict, Field


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


class StockScrapeRequest(BaseModel):
    limit: int | None = Field(default=None, ge=1, le=503)
