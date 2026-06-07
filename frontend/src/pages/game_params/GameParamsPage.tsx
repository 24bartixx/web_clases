import { MDBBtn, MDBInput } from 'mdb-react-ui-kit';
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
  simulationName: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  selectedStockIds: number[];
}

export function GameParamsPage() {
  const navigate = useNavigate();

  const { createGame } = useGame();
  const [stocks, setStocks] = useState<StockMinimal[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [gameParams, setGameParams] = useState<GameParams>({
    simulationName: '',
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
    const value =
      e.target.name === 'simulationName'
        ? e.target.value
        : Number(e.target.value);
    setGameParams({ ...gameParams, [e.target.name]: value });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const simulationName = gameParams.simulationName.trim();
    const hasValidationErrors =
      simulationName.length === 0 ||
      gameParams.budget < 1 ||
      gameParams.selectedStockIds.length === 0;

    setShowValidationErrors(hasValidationErrors);

    if (hasValidationErrors) {
      return;
    }

    try {
      const simulation = await createGame({
        simulationName,
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

  const isSimulationNameInvalid =
    showValidationErrors && gameParams.simulationName.trim().length === 0;
  const isBudgetInvalid = showValidationErrors && gameParams.budget < 1;
  const isCompanySelectionInvalid =
    showValidationErrors && gameParams.selectedStockIds.length === 0;

  return (
    <div className="container min-vh-100 py-5 game-params-page d-flex flex-column align-items-center justify-content-center">
      <h1>New game</h1>
      <h4 className="mb-4">Set game parameters</h4>

      <form
        noValidate
        onSubmit={onSubmit}
        className="w-100 d-flex flex-column gap-4 mt-4"
        style={{ maxWidth: '560px' }}
      >
        <div>
          <MDBInput
            type="text"
            value={gameParams.simulationName}
            name="simulationName"
            size="lg"
            maxLength={255}
            onChange={onChange}
            label="Your simulation name"
            className={isSimulationNameInvalid ? 'is-invalid' : ''}
          />
          {isSimulationNameInvalid && (
            <p className="game-params-field-error">
              Simulation name is required.
            </p>
          )}
        </div>

        <MDBInput
          type="number"
          value={gameParams.budget}
          name="budget"
          size="lg"
          min={1}
          onChange={onChange}
          id="validationCustom01"
          label="Starting budget (USD)"
          className={isBudgetInvalid ? 'is-invalid' : ''}
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

        <div>
          <CompanyMultiSelect
            allCompanies={stocks}
            selectedIds={gameParams.selectedStockIds}
            isInvalid={isCompanySelectionInvalid}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
          {isCompanySelectionInvalid && (
            <p className="game-params-field-error">
              Select at least one company.
            </p>
          )}
        </div>

        <div className="col-12 mt-4 d-flex flex-column flex-md-row gap-3">
          <MDBBtn
            type="button"
            className="w-100 !min-h-[3rem] !rounded-full !border !border-white/70 !bg-transparent !px-6 !text-sm !font-bold !uppercase !text-white !shadow-none !no-underline transition hover:!border-white hover:!bg-white/10 hover:!text-white hover:!shadow-none hover:!no-underline focus:!shadow-none"
            onClick={() => navigate('/')}
          >
            Back
          </MDBBtn>
          <MDBBtn
            type="submit"
            className="w-100 !min-h-[3rem] !rounded-full !border !border-[rgb(222,227,230)] !bg-[rgb(222,227,230)] !px-6 !text-sm !font-bold !uppercase !text-[rgb(15,20,22)] !shadow-none transition hover:!border-white hover:!bg-white hover:!text-[rgb(15,20,22)] hover:!shadow-none focus:!shadow-none"
          >
            Submit form
          </MDBBtn>
        </div>
      </form>
    </div>
  );
}
