import {
  MDBContainer,
  MDBIcon,
  MDBSpinner,
  MDBTable,
  MDBTableBody,
  MDBTableHead,
} from 'mdb-react-ui-kit';
import { Stock, StockDetails } from '../../types';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import { StockItemView } from './StockItemView';
import { useLocation, useNavigate } from 'react-router';
import { Key, useEffect, useMemo } from 'react';
import { InfoModal } from '../../components/InfoModal';
import { PriceMetrics } from '../../utils';
import { useGame } from '../../contexts/GameContext';

// prettier-ignore
type RowData = Stock &StockDetails & PriceMetrics & { volume: number };

export function StocksViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState, resumeGame } = useGame();

  const simulationPositions = useMemo(
    () => gameState.stockPositions ?? [],
    [gameState.stockPositions],
  );

  const resumeSimulationId =
    typeof location.state?.resumeSimulationId === 'number'
      ? location.state.resumeSimulationId
      : null;

  useEffect(() => {
    if (
      resumeSimulationId === null ||
      gameState.simulationId === resumeSimulationId
    ) {
      return;
    }

    resumeGame(resumeSimulationId);
  }, [gameState.simulationId, resumeGame, resumeSimulationId]);

  const tableData: RowData[] = useMemo(() => {
    return simulationPositions.map((position) => {
      return {
        ...position.stock,
        currentPrice: position.currentPrice,
        priceChange: position.priceChange,
        priceChangePercent: position.priceChangePercent,
        volume: position.volume,
      };
    });
  }, [simulationPositions]);

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
  const isResumingGame =
    resumeSimulationId !== null &&
    gameState.simulationId !== resumeSimulationId;

  if (isResumingGame || gameState.status === 'loading') {
    return (
      <MDBContainer className="d-flex justify-content-center align-items-center vh-100">
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
      </MDBContainer>
    );
  }

  if (gameState.status === 'error' || gameState.stockPositions === null) {
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
    <div className="container px-4 py-3 pb-4 my-4 border rounded-3 shadow-sm">
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
            {table.getRowModel().rows.map(
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
