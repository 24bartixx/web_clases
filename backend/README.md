# Alpha Vantage API Integration

Integracja z Alpha Vantage API do pobierania danych giełdowych w Pythonie.

## 📋 Funkcjonalności

- ✅ Pobieranie aktualnych cen akcji
- ✅ Dane czasowe (daily, weekly, monthly)
- ✅ Wyszukiwanie symboli akcji
- ✅ Informacje o firmach
- ✅ Wskaźniki techniczne (SMA, EMA, RSI, MACD, BBANDS, itp.)
- ✅ Dane walutowe i kryptowaluty
- ✅ Towary (złoto, srebro, ropa, itp.)
- ✅ Wskaźniki ekonomiczne

## 🚀 Szybki Start

### Instalacja

```bash
pip install requests
```

### Konfiguracja env:

w pliku .env ustaw:


### Uruchomienie

```bash
python main.py
```

## 📖 Przykłady Użycia

### 1. Pobierz aktualną cenę

```python
from main import AlphaVantageClient

client = AlphaVantageClient(api_key="5B58U4AWK5N2FO1S")

# Cena IBM
quote = client.get_global_quote("IBM")
print(quote["Global Quote"]["05. price"])  # Cena
```

### 2. Wyszukaj akcje

```python
# Szukaj Microsoft
results = client.search_symbol("Microsoft")
for match in results["bestMatches"]:
    print(f"{match['1. symbol']}: {match['2. name']}")
```

### 3. Informacje o firmie

```python
info = client.get_company_overview("AAPL")
print(info["Name"])      # nazwa
print(info["Sector"])    # sektor
print(info["PE Ratio"])  # P/E ratio
```

### 4. Wskaźniki techniczne

```python
# Simple Moving Average
sma = client.get_sma("AAPL", interval="daily", time_period=20)

# EMA
ema = client.get_ema("AAPL")

# RSI
rsi = client.get_rsi("AAPL")
```

### 5. Dane czasowe

```python
# Dzienne dane
daily = client.get_time_series_daily("IBM")
print(daily["Time Series (Daily)"]["2026-05-01"])
```

## ⏰ Rate Limits

**Darmowy plan:**

- 5 zapytań/minutę
- 500 zapytań/dzień
- Dane z 15-minutowym opóźnieniem dla US market

**Premium plany:**

- Dostęp do realtime danych
- Wyższe limity zapytań
- Obsługa handlu/opcji

Reguluj opóźnienia w `config.py` - `RATE_LIMIT_DELAY`

## 📊 Obsługiwane Dane

### Akcje (Stocks)

- TIME_SERIES_DAILY
- TIME_SERIES_WEEKLY
- TIME_SERIES_MONTHLY
- GLOBAL_QUOTE
- OVERVIEW

### Waluty (FX)

- CURRENCY_EXCHANGE_RATE
- FX_DAILY, FX_WEEKLY, FX_MONTHLY

### Kryptowaluty

- CURRENCY_EXCHANGE_RATE (BTC, ETH, etc.)
- DIGITAL_CURRENCY_DAILY, etc.

### Towary

- GOLD, SILVER, WTI, BRENT, COPPER, itp.

### Wskaźniki Ekonomiczne

- REAL_GDP, INFLATION, UNEMPLOYMENT, itp.

### Wskaźniki Techniczne

- SMA, EMA, WMA, DEMA, TEMA, KAMA, MAMA, VWAP
- MACD, STOCH, RSI, ADX, BBANDS, ATR, i wiele więcej

## 🔍 Dokumentacja API

- Pełna dokumentacja: https://www.alphavantage.co/documentation/
- Zarejestruj się: https://www.alphavantage.co/support/#api-key
- Darmowy klucz: Tego samego dnia

## 💡 Tips

1. **Rate Limity**: Czekaj między zapytaniami - używaj `time.sleep()`
2. **Lokalizacja**: API zwraca US market - zmień `datatype=csv` dla CSV
3. **Historyczne Dane**: Pobierz za jeden raz zamiast robić wiele zapytań
4. **Cache**: Przechowuj dane lokalnie by zaoszczędzić limit
5. **Real-time**: Subskrybuj premium dla real-time danych bez opóźnień

## 📝 Struktura Projektu

```
web_clases/
├── main.py           # Główny kod integracji
├── config.py         # Konfiguracja API
├── README.md         # Ta dokumentacja
└── requirements.txt  # Zależności (jeśli będzie)
```

## 🐛 Troubleshooting

### "Error Message" w odpowiedzi

- Sprawdzić API Key
- Sprawdzić limit zapytań (czekać minutę)
- Sprawdzić symbol

### "Note: Thank you for..." (Rate limit)

- Czekać 60 sekund
- Zmniejszyć częstotliwość zapytań

### Brak danych

- Premium funkcje wymagają premium subscription
- Niektóre symbole mogą być niedostępne

## 📞 Wsparcie

- Email: support@alphavantage.co
- Dokumentacja: https://www.alphavantage.co/documentation/
- Stack Overflow: Tag `alpha-vantage`

## 📄 Licencja

Alpha Vantage API - https://www.alphavantage.co/terms_of_service/

---

**Ostatnia aktualizacja**: 2 maja 2026
