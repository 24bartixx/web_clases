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

  const { gameState, createGame } = useGame();
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
    await createGame({
      startingBudget: gameParams.budget,
      stockIds: gameParams.selectedStockIds,
      startDate: dateToDateString(gameParams.startDate),
      finishDate: dateToDateString(gameParams.endDate),
    });

    if (gameState.error) {
      alert('Nie udało się utworzyć gry: ' + gameState.error);
    } else {
      alert('Gra została utworzona!');
      navigate('/stocks-view');
    }
  };

  return (
    <div className="container py-5 game-params-page">
      <h1>Nowa gra!</h1>
      <h4 className="mb-4">Ustal parametry rozgrywki</h4>

      <MDBValidation
        onSubmit={onSubmit}
        className="col-md-4 d-flex flex-column gap-4 mt-16 "
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
          label="Określ budżet startowy (PLN)"
        />

        <CompanyMultiSelect
          allCompanies={stocks}
          selectedIds={gameParams.selectedStockIds}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />

        <DatePicker
          selected={gameParams.startDate}
          onChange={(date: Date | null) => {
            if (date) {
              setGameParams({ ...gameParams, startDate: date });
            }
          }}
          // Podstawa: włączenie dropdownów
          showMonthDropdown
          showYearDropdown
          // Dodatkowe usprawnienie: lata wyświetlają się w scrollowanej liście, a nie długim menu
          dropdownMode="select"
          // Opcjonalnie: zakres lat wstecz i w przód (np. 100 lat wstecz od teraz)
          yearDropdownItemNumber={100}
          dateFormat="dd/MM/yyyy"
        />

        <DatePicker
          selected={gameParams.endDate}
          onChange={(date: Date | null) => {
            if (date) {
              setGameParams({ ...gameParams, endDate: date });
            }
          }}
          // Podstawa: włączenie dropdownów
          showMonthDropdown
          showYearDropdown
          // Dodatkowe usprawnienie: lata wyświetlają się w scrollowanej liście, a nie długim menu
          dropdownMode="select"
          // Opcjonalnie: zakres lat wstecz i w przód (np. 100 lat wstecz od teraz)
          yearDropdownItemNumber={100}
          dateFormat="dd/MM/yyyy"
        />

        <div className="col-12">
          <MDBBtn type="submit">Submit form</MDBBtn>
        </div>
      </MDBValidation>
    </div>
  );
}
