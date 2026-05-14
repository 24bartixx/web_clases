"""
Alpha Vantage API Integration
Pobiera dane giełdowe z Alpha Vantage API
"""
import requests
import json
import time
from typing import Dict, Any, Optional
from config import API_KEY, BASE_URL


class AlphaVantageClient:
    """Klient do obsługi Alpha Vantage API"""
    
    BASE_URL = BASE_URL
    
    def __init__(self, api_key: str = "demo"):
        """
        Inicjalizuje klienta
        
        Args:
            api_key: Klucz API (domyślnie 'demo')
        """
        self.api_key = api_key
    
    def _make_request(self, params: Dict[str, str]) -> Dict[str, Any]:
        """
        Wysyła żądanie do API
        
        Args:
            params: Parametry zapytania
            
        Returns:
            Odpowiedź JSON
        """
        params['apikey'] = self.api_key
        
        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Debug: Sprawdź czy API zwróciło błąd
            if "Error Message" in data:
                print(f"  ⚠️  API Error: {data['Error Message']}")
            elif "Note" in data:
                print(f"  ⚠️  API Note (Rate limit?): {data['Note']}")
            
            return data
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Błąd żądania: {e}")
            return {}
    
    def get_global_quote(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera aktualną cenę i informacje o akcjach
        
        Args:
            symbol: Symbol akcji (np. 'IBM', 'AAPL')
            
        Returns:
            Dane o cenie
        """
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol
        }
        return self._make_request(params)
    
    def get_time_series_daily(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera dzienne danych czasowych
        
        Args:
            symbol: Symbol akcji
            
        Returns:
            Dane czasowe
        """
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol
        }
        return self._make_request(params)
    
    def search_symbol(self, keywords: str) -> Dict[str, Any]:
        """
        Szuka symboli akcji na podstawie słów kluczowych
        
        Args:
            keywords: Słowa do wyszukania (np. 'Microsoft')
            
        Returns:
            Wyniki wyszukiwania
        """
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': keywords
        }
        return self._make_request(params)
    
    def get_company_overview(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera informacje o firmie
        
        Args:
            symbol: Symbol akcji
            
        Returns:
            Informacje o firmie
        """
        params = {
            'function': 'OVERVIEW',
            'symbol': symbol
        }
        return self._make_request(params)
    
    def get_sma(self, symbol: str, interval: str = "daily", 
                time_period: int = 10, series_type: str = "close") -> Dict[str, Any]:
        """
        Pobiera Simple Moving Average (wskaźnik techniczny)
        
        Args:
            symbol: Symbol akcji
            interval: Przedział czasowy ('1min', '5min', 'daily', 'weekly', etc.)
            time_period: Liczba punktów danych dla obliczenia
            series_type: Typ ceny ('close', 'open', 'high', 'low')
            
        Returns:
            Dane SMA
        """
        params = {
            'function': 'SMA',
            'symbol': symbol,
            'interval': interval,
            'time_period': str(time_period),
            'series_type': series_type
        }
        return self._make_request(params)
    
    def pretty_print(self, data: Dict[str, Any], indent: int = 2) -> None:
        """Ładnie wypisuje JSON"""
        print(json.dumps(data, indent=indent, ensure_ascii=False))


def main():
    """Przykład użycia"""
    
    # Utwórz klienta (API_KEY pobierany z .env via config)
    client = AlphaVantageClient(api_key=API_KEY)
    
    print("=" * 60)
    print("Alpha Vantage API Integration - Przykłady")
    print(f"Używany API Key: {API_KEY[:10]}...")
    print("=" * 60)
    
    # 1. Wyszukaj symbol
    print("\n1️⃣  Wyszukiwanie symbolu 'Microsoft':")
    print("-" * 40)
    search_result = client.search_symbol("Microsoft")
    if 'bestMatches' in search_result:
        for match in search_result['bestMatches'][:3]:  # Pierwsze 3 wyniki
            print(f"  ✓ {match['1. symbol']}: {match['2. name']}")
    else:
        print("  Brak wyników wyszukiwania")
    
    # Czekaj przed następnym zapytaniem (rate limit)
    print("\n⏳ Czekanie 2s (rate limit: 5 zapytań/min)...")
    time.sleep(2)
    
    # 2. Pobierz aktualną cenę IBM
    print("\n2️⃣  Aktualna cena IBM (GLOBAL_QUOTE):")
    print("-" * 40)
    quote = client.get_global_quote("IBM")
    if 'Global Quote' in quote:
        gq = quote['Global Quote']
        if gq.get('05. price'):
            print(f"  💰 Cena: ${gq.get('05. price', 'N/A')}")
            print(f"  📈 Zmiana: {gq.get('09. change', 'N/A')} ({gq.get('10. change percent', 'N/A')})")
            print(f"  📊 Wolumen: {gq.get('06. volume', 'N/A')}")
        else:
            print("  (Brak danych - możliwy rate limit)")
    else:
        print("  (Brak danych)")
    
    time.sleep(2)
    
    # 3. Pobierz informacje o firmie
    print("\n3️⃣  Informacje o firmie IBM:")
    print("-" * 40)
    overview = client.get_company_overview("IBM")
    if 'Name' in overview:
        print(f"  🏢 Nazwa: {overview.get('Name', 'N/A')}")
        print(f"  🏭 Sektor: {overview.get('Sector', 'N/A')}")
        print(f"  📝 Opis: {overview.get('Description', 'N/A')[:100]}...")
    else:
        print("  (Brak danych)")
    
    time.sleep(2)
    
    # 4. Pobierz SMA (wskaźnik techniczny)
    print("\n4️⃣  Simple Moving Average (SMA) dla IBM:")
    print("-" * 40)
    sma = client.get_sma("IBM", interval="daily", time_period=20)
    if 'Technical Analysis: SMA' in sma:
        data = sma['Technical Analysis: SMA']
        # Pobierz pierwszy wpis
        first_date = list(data.keys())[0]
        print(f"  📅 Ostatnia data: {first_date}")
        print(f"  📊 SMA(20): {data[first_date]['SMA']}")
    else:
        print("  (Brak danych)")
    
    print("\n" + "=" * 60)
    print("✅ Integracja Alpha Vantage API gotowa!")
    print("\n📌 Informacje:")
    print("  • Darmowy plan: 5 zapytań/min, 500 zapytań/dzień")
    print("  • Limity wpływają na wcześniejsze zapytania")
    print("  • Dokumentacja: https://www.alphavantage.co/documentation/")
    print("=" * 60)


if __name__ == "__main__":
    main()
