from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stock_id: int
    ticker: str
    company_name: str | None
    sector: str | None
    industry: str | None


class StockScrapeRequest(BaseModel):
    limit: int | None = Field(default=None, ge=1, le=503)


class StockPriceRead(BaseModel):
    price_date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    dividend_amount: float | None = None


class StockDetailsRead(BaseModel):
    description: str | None = None
    sharesOutstanding: int | None = None
    floatShares: int | None = None
    country: str | None = None
    currency: str | None = None
    website: str | None = None
