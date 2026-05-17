import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class AlphaVantageError(Exception):
    pass


class AlphaVantageRateLimitError(AlphaVantageError):
    pass


class AlphaVantageClient:
    base_url = "https://www.alphavantage.co/query"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_company_overview(self, ticker: str):
        return self._get(
            {
                "function": "OVERVIEW",
                "symbol": self._to_alpha_vantage_symbol(ticker),
            }
        )

    def get_daily_prices(self, ticker: str):
        return self._get(
            {
                "function": "TIME_SERIES_DAILY",
                "symbol": self._to_alpha_vantage_symbol(ticker),
                "outputsize": "full",
            }
        )

    def get_sma(self, ticker: str, time_period: int):
        return self._get(
            {
                "function": "SMA",
                "symbol": self._to_alpha_vantage_symbol(ticker),
                "interval": "daily",
                "time_period": str(time_period),
                "series_type": "close",
            }
        )

    def _get(self, params: dict[str, str]):
        query_params = {**params, "apikey": self.api_key}
        url = f"{self.base_url}?{urlencode(query_params)}"
        request = Request(url, headers={"User-Agent": "chess-bros-trading-backend/0.1"})

        with urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))

        self._raise_for_api_message(data)
        return data

    def _raise_for_api_message(self, data: dict):
        if "Error Message" in data:
            raise AlphaVantageError(data["Error Message"])

        message = data.get("Note") or data.get("Information")
        if not message:
            return

        normalized = message.lower()
        if "rate limit" in normalized or "frequency" in normalized:
            raise AlphaVantageRateLimitError(message)

        raise AlphaVantageError(message)

    def _to_alpha_vantage_symbol(self, ticker: str):
        return ticker.replace(".", "-").upper()
