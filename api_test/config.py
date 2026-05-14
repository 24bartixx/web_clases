"""
Konfiguracja Alpha Vantage API
Ładuje zmienne z pliku .env
"""
import os
from dotenv import load_dotenv

# Ładuj zmienne z .env
load_dotenv()

# API Key - pobiera z .env lub ustawia domyślny
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

# Ustawienia API
BASE_URL = os.getenv("API_BASE_URL", "https://www.alphavantage.co/query")

# Rate limiting
RATE_LIMIT_DELAY = float(os.getenv("RATE_LIMIT_DELAY", "0.2"))
MAX_REQUESTS_PER_MINUTE = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "5"))
MAX_REQUESTS_PER_DAY = int(os.getenv("MAX_REQUESTS_PER_DAY", "500"))

# Symbole do monitorowania (pobiera z .env i parsuje)
SYMBOLS_TO_WATCH = os.getenv("SYMBOLS_TO_WATCH", "IBM,MSFT,AAPL").split(",")

# Przedziały czasowe
INTERVALS = {
    "intraday": ["1min", "5min", "15min", "30min", "60min"],
    "daily": "daily",
    "weekly": "weekly",
    "monthly": "monthly"
}

# Typy cen do analizy
PRICE_TYPES = ["close", "open", "high", "low"]

# Wskaźniki techniczne
TECHNICAL_INDICATORS = {
    "SMA": {
        "name": "Simple Moving Average",
        "time_periods": [10, 20, 50, 200]
    },
    "EMA": {
        "name": "Exponential Moving Average",
        "time_periods": [10, 20, 50]
    },
    "RSI": {
        "name": "Relative Strength Index",
        "time_periods": [14]
    },
    "MACD": {
        "name": "MACD",
        "time_periods": []  # MACD nie wymaga time_period
    },
    "BBANDS": {
        "name": "Bollinger Bands",
        "time_periods": [20]
    }
}
