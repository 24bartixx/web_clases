import { MDBBtn, MDBInput, MDBValidation } from 'mdb-react-ui-kit';
import { CompanyMultiSelect } from './CompanyMultiSelect';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale/pl';
import { useGame } from '../../contexts/GameContext';
import { useNavigate } from 'react-router-dom';
import { getStocks } from '../../api/stocksApi';
import type { StockMinimal } from '../../types';
registerLocale('pl', pl);

interface GameParams {
  budget: number;
  startDate: Date;
  endDate: Date;
  selectedStockIds: number[];
}

export function GameParamsPage() {
  const navigate = useNavigate();

  const { createGame } = useGame();
  const [stocks, setStocks] = useState<StockMinimal[]>([]);

  const [gameParams, setGameParams] = useState<GameParams>({
    budget: 1000_000,
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2026, 0, 1),
    selectedStockIds: [],
  });

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const stocks = await getStocks({ limit: 500 });
        setStocks(
          stocks.map(({ stockId, ticker, companyName }) => ({
            stockId,
            ticker,
            companyName,
          })),
        );
      } catch (error) {
        console.error('Failed to fetch stocks:', error);
      }
    };

    fetchStocks();
  }, []);

  const handleSelect = (stockId: number) => {
    setGameParams((params) => ({
      ...params,
      selectedStockIds: [...params.selectedStockIds, Number(stockId)],
    }));
  };

  const handleRemove = (stockId: number) => {
    setGameParams((params) => ({
      ...params,
      selectedStockIds: params.selectedStockIds.filter((id) => id !== stockId),
    }));
  };

  const dateToDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGameParams({ ...gameParams, [e.target.name]: Number(e.target.value) });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const simulation = await createGame({
        startingBudget: gameParams.budget,
        stockIds: gameParams.selectedStockIds,
        startDate: dateToDateString(gameParams.startDate),
        finishDate: dateToDateString(gameParams.endDate),
      });

      navigate(`/game/${simulation.simulation_id}/stocks-view`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert('Could not create game: ' + errorMessage);
    }
  };

  return (
    <div className="container min-vh-100 py-5 game-params-page d-flex flex-column align-items-center justify-content-center">
      <h1>New game</h1>
      <h4 className="mb-4">Set game parameters</h4>

      <MDBValidation
        onSubmit={onSubmit}
        className="w-100 d-flex flex-column gap-4 mt-4"
        style={{ maxWidth: '560px' }}
      >
        <MDBInput
          type="number"
          value={gameParams.budget}
          name="budget"
          size="lg"
          min={1}
          onChange={onChange}
          id="validationCustom01"
          required
          label="Set starting budget (USD)"
        />

        <div className="d-flex flex-column flex-md-row gap-4">
          <MDBInput
            type="date"
            value={dateToDateString(gameParams.startDate)}
            onChange={(e) => {
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                setGameParams({ ...gameParams, startDate: date });
              }
            }}
            size="lg"
            label="Game start date"
            className="w-100"
          />

          <MDBInput
            type="date"
            value={dateToDateString(gameParams.endDate)}
            onChange={(e) => {
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                setGameParams({ ...gameParams, endDate: date });
              }
            }}
            size="lg"
            label="Game end date"
            className="w-100"
          />
        </div>

        <div className="game-params-divider" />

        <CompanyMultiSelect
          allCompanies={stocks}
          selectedIds={gameParams.selectedStockIds}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />

        <div className="col-12 mt-4 d-flex flex-column flex-md-row gap-3">
          <MDBBtn
            type="button"
            color="link"
            className="w-100 !border !border-[var(--bs-primary)] !bg-transparent !text-[var(--bs-primary)] !no-underline hover:!bg-[var(--bs-primary)] hover:!text-[var(--bs-primary-text-emphasis)] hover:!no-underline"
            onClick={() => navigate('/')}
          >
            Back
          </MDBBtn>
          <MDBBtn type="submit" className="w-100">
            Submit form
          </MDBBtn>
        </div>
      </MDBValidation>
    </div>
  );
}
