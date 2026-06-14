import {
  MDBContainer,
  MDBIcon,
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
import { useNavigate, useParams } from 'react-router';
import { Key, useMemo } from 'react';
import { InfoModal } from '../../components/InfoModal';
import { PriceMetrics } from '../../utils';
import { useGame } from '../../contexts/GameContext';
import { CustomLoading } from '../../components/Common/CustomLoading';

// prettier-ignore
type RowData = Stock &StockDetails & PriceMetrics & { volume: number };

export function StocksViewPage() {
  const navigate = useNavigate();
  const { simulationId } = useParams<{ simulationId: string }>();
  const { gameState } = useGame();

  const simulationPositions = useMemo(
    () => gameState.stockPositions ?? [],
    [gameState.stockPositions],
  );

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
            className="gap-1 p-0 text-white bg-transparent border-0 d-flex align-items-center fs-5"
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
        header: createSortableHeader('Volume'),
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

  const handleClick = (ticker: string) =>
    navigate(`/game/${simulationId}/trading-view/${ticker}`, {
      state: { gameMenuSection: 'stocks-view' },
    });

  if (gameState.status === 'loading') {
    return (
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <CustomLoading />
      </div>
    );
  }

  if (gameState.status === 'error' || gameState.stockPositions === null) {
    return (
      <InfoModal
        open={true}
        title="Error"
        bodyText="Could not find this stock. You will be redirected to the home page."
        btnText="Close"
        onClose={() => navigate('/')}
        onConfirm={() => navigate('/')}
      />
    );
  }

  return (
    <div className="container px-4 py-3 pb-4 my-4 border shadow-sm rounded-3">
      <MDBContainer className="gap-3 d-flex flex-column">
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
