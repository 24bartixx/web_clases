import { MDBBtn, MDBInput, MDBValidation } from 'mdb-react-ui-kit';
import { CompanyMultiSelect } from './CompanyMultiSelect';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale/pl';
import { useGame } from '../../contexts/GameContext';
import { useNavigate } from 'react-router-dom';
registerLocale('pl', pl);

interface GameParams {
  budget: number;
  startDate: string;
  endDate: string;
  companiesTickets: string[];
}

export function GameParamsPage() {
  const navigate = useNavigate();

  const { gameState, createGame } = useGame();

  const [finishDate, setFinishDate] = useState(new Date());

  const [gameParams, setGameParams] = useState<GameParams>({
    budget: 1000_000,
    startDate: '2010-01-01',
    time: '5y',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.name === 'budget' || e.target.name === 'companiesCount'
        ? Number(e.target.value)
        : e.target.value;

    setGameParams({ ...gameParams, [e.target.name]: value });
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    const newGame = await createGame({
      startingBudget: gameParams.budget,
      companiesTickets: gameParams.companiesTickets,
      startDate: gameParams.startDate,
      finishDate: gameParams.endDate,
      companiesTickets: [],
      startDate: startDate.toISOString().split('T')[0],
      finishDate: finishDate.toISOString().split('T')[0],
    });

    if (gameState.error) {
      alert('Nie udało się utworzyć gry: ' + gameState.error);
    } else {
      alert('Gra została utworzona!');
      navigate('/portfolio');
    }
  };

  return (
    <div className="container py-5">
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
          type="number"
          onChange={onChange}
          id="validationCustom01"
          required
          label="Określ budżet startowy (PLN)"
        />

        <CompanyMultiSelect
          allCompanies={ALL_COMPANIES}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />

        <MDBInput
          type="number"
          value={gameParams.startDate}
          name="startDate"
          size="lg"
          type="date"
          onChange={onChange}
          id="validationCustom02"
          required
          label="Wybierz ile firm będzie dostępnych w ramach gry"
        />

        <DatePicker
          selected={startDate}
          onChange={(date: Date | null) => setStartDate(date || new Date())}
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
          selected={finishDate}
          onChange={(date: Date | null) => setFinishDate(date || new Date())}
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
