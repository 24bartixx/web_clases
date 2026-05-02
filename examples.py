"""
Zaawansowane przykłady użycia Alpha Vantage API
"""
from main import AlphaVantageClient
import time
from config import API_KEY, SYMBOLS_TO_WATCH


def example_portfolio_analysis():
    """Analiza portfela akcji"""
    print("\n" + "=" * 70)
    print("📊 ANALIZA PORTFELA")
    print("=" * 70)
    
    client = AlphaVantageClient(api_key=API_KEY)
    
    symbols = ["AAPL", "MSFT", "GOOGL"]
    
    for symbol in symbols:
        print(f"\n📈 {symbol}")
        print("-" * 50)
        
        # Cena
        quote = client.get_global_quote(symbol)
        if 'Global Quote' in quote and quote['Global Quote'].get('05. price'):
            gq = quote['Global Quote']
            price = float(gq.get('05. price', 0))
            change = float(gq.get('09. change', 0))
            change_pct = gq.get('10. change percent', '0%').replace('%', '')
            
            trend = "📈" if float(change_pct) > 0 else "📉"
            print(f"  Cena: ${price:.2f} {trend} {change_pct}%")
            print(f"  Wolumen: {gq.get('06. volume', 'N/A'):>12}")
        
        time.sleep(2)  # Rate limit
        
        # Wskaźnik RSI
        print(f"  Pobieranie wskaźników...")
        # (RSI wymagałby więcej zapytań - tu jest placeholder)


def example_technical_analysis():
    """Analiza techniczna"""
    print("\n" + "=" * 70)
    print("📐 ANALIZA TECHNICZNA")
    print("=" * 70)
    
    client = AlphaVantageClient(api_key=API_KEY)
    symbol = "IBM"
    
    print(f"\nSymbol: {symbol}")
    print("-" * 50)
    
    # SMA
    print("\n📊 Simple Moving Average:")
    sma = client.get_sma(symbol, interval="daily", time_period=20)
    if 'Technical Analysis: SMA' in sma:
        data = sma['Technical Analysis: SMA']
        dates = list(data.keys())[:5]
        for date in dates:
            print(f"  {date}: {data[date]['SMA']}")
    
    time.sleep(2)


def example_fundamental_analysis():
    """Analiza fundamentalna"""
    print("\n" + "=" * 70)
    print("📋 ANALIZA FUNDAMENTALNA")
    print("=" * 70)
    
    client = AlphaVantageClient(api_key=API_KEY)
    symbol = "AAPL"
    
    print(f"\nSymbol: {symbol}")
    print("-" * 50)
    
    overview = client.get_company_overview(symbol)
    
    if 'Name' in overview:
        print(f"\n🏢 {overview.get('Name', 'N/A')}")
        print(f"   Giełda: {overview.get('Exchange', 'N/A')}")
        print(f"   Waluta: {overview.get('Currency', 'N/A')}")
        print(f"   Sektor: {overview.get('Sector', 'N/A')}")
        print(f"   Industria: {overview.get('Industry', 'N/A')}")
        
        print(f"\n💰 Wycena:")
        print(f"   MarketCap: ${overview.get('MarketCapitalization', 'N/A')}")
        print(f"   PE Ratio: {overview.get('PERatio', 'N/A')}")
        print(f"   Div Yield: {overview.get('DividendYield', 'N/A')}")
        
        print(f"\n📈 Performans:")
        print(f"   52-Week High: ${overview.get('52WeekHigh', 'N/A')}")
        print(f"   52-Week Low: ${overview.get('52WeekLow', 'N/A')}")
        
        print(f"\n📊 Wzrost:")
        print(f"   Earnings Date: {overview.get('EarningsDate', 'N/A')}")
        print(f"   EPS: {overview.get('EPS', 'N/A')}")


def example_search_stocks():
    """Wyszukiwanie akcji"""
    print("\n" + "=" * 70)
    print("🔍 WYSZUKIWANIE AKCJI")
    print("=" * 70)
    
    client = AlphaVantageClient(api_key=API_KEY)
    
    keywords_list = ["Tesla", "Meta", "Amazon"]
    
    for keywords in keywords_list:
        print(f"\n🔎 Szukanie: '{keywords}'")
        print("-" * 50)
        
        results = client.search_symbol(keywords)
        if 'bestMatches' in results:
            for i, match in enumerate(results['bestMatches'][:3], 1):
                symbol = match['1. symbol']
                name = match['2. name']
                region = match['4. region']
                print(f"  {i}. {symbol} - {name} ({region})")
        
        time.sleep(2)  # Rate limit


def compare_stocks():
    """Porównaj kilka akcji"""
    print("\n" + "=" * 70)
    print("⚖️  PORÓWNANIE AKCJI")
    print("=" * 70)
    
    client = AlphaVantageClient(api_key=API_KEY)
    symbols = ["AAPL", "MSFT", "IBM"]
    
    print(f"\nPorównanie: {', '.join(symbols)}")
    print("-" * 50)
    
    data = {}
    for symbol in symbols:
        quote = client.get_global_quote(symbol)
        if 'Global Quote' in quote and quote['Global Quote'].get('05. price'):
            gq = quote['Global Quote']
            data[symbol] = {
                'price': float(gq.get('05. price', 0)),
                'change_pct': float(gq.get('10. change percent', 0).replace('%', '')),
                'volume': int(gq.get('06. volume', 0))
            }
        time.sleep(2)
    
    # Posortuj po procentowej zmianie
    sorted_data = sorted(data.items(), key=lambda x: x[1]['change_pct'], reverse=True)
    
    print(f"\n{'Symbol':<8} {'Cena':<12} {'Zmiana %':<12} {'Wolumen':<15}")
    print("-" * 50)
    for symbol, info in sorted_data:
        trend = "📈" if info['change_pct'] > 0 else "📉"
        print(f"{symbol:<8} ${info['price']:<11.2f} {trend} {info['change_pct']:<11.2f}% {info['volume']:>14,}")


def main():
    """Uruchom wszystkie przykłady"""
    print("\n" + "=" * 70)
    print("🚀 ZAAWANSOWANE PRZYKŁADY - ALPHA VANTAGE API")
    print("=" * 70)
    
    try:
        # 1. Wyszukiwanie
        example_search_stocks()
        time.sleep(3)
        
        # 2. Porównanie akcji
        compare_stocks()
        time.sleep(3)
        
        # 3. Analiza fundamentalna
        example_fundamental_analysis()
        time.sleep(3)
        
        # 4. Analiza techniczna
        example_technical_analysis()
        time.sleep(3)
        
        # 5. Analiza portfela
        example_portfolio_analysis()
        
        print("\n" + "=" * 70)
        print("✅ Wszystkie przykłady zostały wykonane!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Błąd: {e}")


if __name__ == "__main__":
    main()
