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
  PriceDto,
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

import { StockItemView } from './StockItemView';
import { useNavigate, useParams } from 'react-router';
import { Key, useEffect, useMemo, useState } from 'react';
import { InfoModal } from '../../components/InfoModal';
import { calculatePriceMetrics, PriceMetrics } from '../../utils';
import { useQuery } from '@tanstack/react-query';

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

  const [currentDate, setCurrentDate] = useState<Date>(new Date('2025-02-02'));

  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 3);
  prevDate.setHours(0, 0, 0, 0);

  const loadData = async (skip: number): Promise<FinancialData> => {
    const stocksResponse = await fetch(
      `http://localhost:8000/api/stocks/?skip=${skip}&limit=20`,
    );
    if (!stocksResponse.ok) throw new Error(`Status: ${stocksResponse.status}`);
    const stocksRowData: StockDto[] = await stocksResponse.json();

    const detailsRowData: Record<StockDto['ticker'], StockDetailsDto> = {};
    const pricesRowData: Record<StockDto['ticker'], PriceDto[]> = {};

    const start = prevDate.toISOString().split('T')[0];
    const finish = currentDate.toISOString().split('T')[0];

    for (const s of stocksRowData) {
      try {
        const detailsRes = await fetch(
          `http://localhost:8000/api/stocks/${s.ticker}/details`,
        );
        if (!detailsRes.ok) throw new Error(`Failed for ${s.ticker}`);
        const detailsData = await detailsRes.json();
        detailsRowData[s.ticker] = detailsData;

        const pricesRes = await fetch(
          `http://localhost:8000/api/stocks/${s.ticker}/prices?start=${start}&finish=${finish}&interval=1d`,
        );
        if (!pricesRes.ok) throw new Error(`Failed for ${s.ticker}`);
        const pricesData = await pricesRes.json();
        pricesRowData[s.ticker] = pricesData;
      } catch (err) {
        console.error(`${s.ticker}:`, err);
        throw err;
      }
    }

    const stocks: Stock[] = stocksRowData.map(mapStockDtoToStock);

    const stocksDetails: Record<Stock['ticker'], StockDetails> =
      Object.fromEntries(
        Object.entries(detailsRowData).map(([ticker, data]) => [
          ticker,
          mapStockDetailsDtoToStockDetails(data),
        ]),
      );

    const pricesRange: Record<Stock['ticker'], Price[]> = Object.fromEntries(
      Object.entries(pricesRowData).map(([ticker, data]) => [
        ticker,
        data.map((value) => mapPriceDtoToPrice(value)),
      ]),
    );

    return { stocks, stocksDetails, pricesRange };
  };

  // prettier-ignore
  const {data: financialData, isLoading, error} = useQuery<FinancialData, Error>({
    queryKey: [process.env.REACT_APP_STOCKS_VIEW_CACHE_KEY],
    queryFn: () => loadData(0),

    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const tableData: RowData[] = useMemo(() => {
    if (
      !financialData ||
      !financialData.stocks ||
      !financialData.stocksDetails ||
      !financialData.pricesRange
    )
      return [];

    return financialData.stocks.map((stock: Stock) => {
      const prices = getPricesFromRange(
        financialData.pricesRange[stock.ticker],
      );
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
  }, [financialData, getPricesFromRange, calculatePriceMetrics]);

  const columnHelper = createColumnHelper<RowData>();

  const columns = useMemo(() => {
    const createSortableHeader = (title: string) => {
      return ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();
        return (
          <button
            onClick={column.getToggleSortingHandler()}
            className="bg-transparent border-0 text-white d-flex align-items-center gap-1 fs-5 p-0"
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

  if (isLoading) {
    return (
      <MDBContainer className="d-flex justify-content-center align-items-center vh-100">
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
      </MDBContainer>
    );
  }

  if (
    error ||
    !financialData ||
    !financialData.stocks ||
    !financialData.stocksDetails ||
    !financialData.pricesRange
  ) {
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
            {table
              .getHeaderGroups()
              .map(
                (headerGroup: {
                  id: Key | null | undefined;
                  headers: any[];
                }) => (
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
                ),
              )}
          </MDBTableHead>
          <MDBTableBody>
            {table
              .getRowModel()
              .rows.map(
                (row: {
                  id: Key | null | undefined;
                  original: {
                    volume: number;
                    currentPrice: number;
                    ticker: string;
                    companyName: string;
                    sector: string;
                    industry: string;
                    currency: string;
                    priceChangePercent: number;
                  };
                }) => {
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
                },
              )}
          </MDBTableBody>
        </MDBTable>
      </MDBContainer>
    </div>
  );
}
