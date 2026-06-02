import {
  MDBBtn,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBRow,
  MDBSpinner,
  MDBTable,
  MDBTableBody,
  MDBTableHead,
  MDBTypography,
} from 'mdb-react-ui-kit';
import {
  mapPriceDtoToPrice,
  mapStockDetailsDtoToStockDetails,
  mapStockDtoToStock,
  Price,
  Stock,
  StockDetails,
  StockDetailsDto,
  StockDto,
} from '../../types';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import ls from 'localstorage-slim';

import { StockItemView } from './StockItemView';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { InfoModal } from '../../components/InfoModal';
import { calculatePriceMetrics, PriceMetrics } from '../../utils';

// prettier-ignore
type RowData = Stock &StockDetails & PriceMetrics & { volume: number };
type FinancialData = {
  stocks: Stock[];
  stocksDetails: Record<Stock['ticker'], StockDetails>;
  pricesRange: Record<Stock['ticker'], Price[]>;
};
// prettier-ignore
const getPricesFromRange = (priceRange: Price[] | undefined): { todayPrice: Price | undefined; yesterdayPrice: Price | undefined } => {
  if (!priceRange || priceRange.length === 0) {
    return { todayPrice: undefined, yesterdayPrice: undefined };
  }
  const todayPrice = priceRange[priceRange.length - 1];
  const yesterdayPrice = priceRange.length > 1 ? priceRange[priceRange.length - 2] : undefined;
  return { todayPrice, yesterdayPrice };
};

export function StocksViewPage() {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentDate, setCurrentDate] = useState<Date>(new Date('2025-02-02'));
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 3);
  prevDate.setHours(0, 0, 0, 0);

  const [financialData, setFinancialData] = useState<FinancialData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const cachedData = ls.get(process.env.REACT_APP_STOCKS_VIEW_CACHE_KEY as string) as FinancialData | null;
        if (cachedData) {
          setFinancialData(cachedData);
          setLoading(false);
          return;
        }

        const stocksResponse = await fetch(
          `http://localhost:8000/api/stocks/?skip=0&limit=20`,
        );
        if (!stocksResponse.ok)
          throw new Error(`Status: ${stocksResponse.status}`);
        const stocksRowData: StockDto[] = await stocksResponse.json();

        const [detailsRowData, pricesRowData] = await Promise.all([
          Promise.all(
            stocksRowData.map(async (s) => {
              const res = await fetch(
                `http://localhost:8000/api/stocks/${s.ticker}/details`,
              );
              if (!res.ok)
                throw new Error(`Failed to fetch details for ${s.ticker}`);
              return { ticker: s.ticker, data: await res.json() };
            }),
          ),
          Promise.all(
            stocksRowData.map(async (s) => {
              const start = prevDate.toISOString().split('T')[0];
              const finish = currentDate.toISOString().split('T')[0];
              const res = await fetch(
                `http://localhost:8000/api/stocks/${s.ticker}/prices?start=${start}&finish=${finish}&interval=1d`,
              );
              if (!res.ok)
                throw new Error(`Failed to fetch prices for ${s.ticker}`);
              return { ticker: s.ticker, data: await res.json() };
            }),
          ),
        ]);

        const stocks:Stock[] = stocksRowData.map(mapStockDtoToStock);

        const stocksDetails: Record<Stock['ticker'], StockDetails> =
          Object.fromEntries(
            detailsRowData.map(({ ticker, data }) => [
              ticker,
              mapStockDetailsDtoToStockDetails(data),
            ]),
          );

        const pricesRange: Record<Stock['ticker'], Price[]> = 
          Object.fromEntries(
            pricesRowData.map(({ ticker, data }) => [
              ticker,
              data.map(mapPriceDtoToPrice),
            ]),
          );

          ls.set(process.env.REACT_APP_STOCKS_VIEW_CACHE_KEY as string, {stocks, stocksDetails, pricesRange}, { ttl: 60 });

          setFinancialData({ stocks, stocksDetails, pricesRange });
        
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const tableData: RowData[] = useMemo(() => {
    if (!financialData || !financialData.stocks || !financialData.stocksDetails || !financialData.pricesRange) return [];

    return financialData.stocks.map((stock) => {
      const prices = getPricesFromRange(financialData.pricesRange[stock.ticker]);
      const volume = prices.todayPrice?.volume || 0;
      const metrics = calculatePriceMetrics(
        prices.todayPrice?.close,
        prices.yesterdayPrice?.close,
      );

      return {
        ...stock,
        ...financialData.stocksDetails[stock.ticker],
        ...metrics,
        volume: volume,
      };
    });
  }, [
    financialData,
    getPricesFromRange,
    calculatePriceMetrics,
  ]);

  const columnHelper = createColumnHelper<RowData>();

 const columns = useMemo(() => {
  const createSortableHeader = (title: string) => {
    return ({ column }: { column: any }) => {
      const isSorted = column.getIsSorted();
      return (
        <button
          onClick={column.getToggleSortingHandler()}
          className="bg-transparent border-0 text-white d-flex align-items-center gap-1 fs-4 p-0"
        >
          <MDBIcon
            fas
            icon={
              isSorted === 'asc'
                ? 'caret-up'
                : isSorted === 'desc'
                  ? 'caret-down'
                  : 'sort'
            }
          />
          {title}
        </button>
      );
    };
  };

  return [
    columnHelper.accessor('companyName', {
      header: createSortableHeader('Company'),
    }),
    columnHelper.accessor('currentPrice', {
      header: createSortableHeader('Price'),
    }),
    columnHelper.accessor('priceChangePercent', {
      header: createSortableHeader('Change'),
    }),
    columnHelper.accessor('volume', {
      header: createSortableHeader('Vol'),
    }),
    columnHelper.accessor('industry', {
      header: createSortableHeader('Industry'),
    }),
    columnHelper.accessor('sector', {
      header: createSortableHeader('Sector'),
    }),
  ];
}, [columnHelper]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleClick = (ticker: string) => navigate(`/trading-view/${ticker}`);

  if (loading) {
    return (
      <MDBContainer className="d-flex justify-content-center align-items-center vh-100">
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
      </MDBContainer>
    );
  }

  if (!financialData || !financialData.stocks || !financialData.stocksDetails || !financialData.pricesRange) {
    return (
      <InfoModal
        open={true}
        title="Błąd"
        bodyText="Nie udało się znaleźć takiej akcji. Zostaniesz przekierowany na stronę główną."
        btnText="Zamknij"
        onClose={() => navigate('/')}
        onConfirm={() => navigate('/')}
      />
    );
  }

  return (
    <div className="container px-4 py-3 pb-4 border rounded-3 shadow-sm">
      <MDBContainer className="d-flex flex-column gap-3">
        <MDBTable>
          <MDBTableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </MDBTableHead>
          <MDBTableBody>
            {table.getRowModel().rows.map((row) => {
              return (
                <StockItemView
                  key={row.id}
                  onClick={handleClick} 
                  volume={row.original.volume}
                  price={row.original.currentPrice}
                  ticker={row.original.ticker}
                  companyName={row.original.companyName}
                  sector={row.original.sector}
                  industry={row.original.industry}
                  currency={row.original.currency}
                  changePricePercent={row.original.priceChangePercent}
                />
              );
            })}
          </MDBTableBody>
        </MDBTable>
      </MDBContainer>
    </div>
  );
}
