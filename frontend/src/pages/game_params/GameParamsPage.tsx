import { MDBBtn, MDBInput, MDBValidation } from 'mdb-react-ui-kit';
import { useState } from 'react';
import { DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale/pl';
import { useGame } from '../../contexts/GameContext';
registerLocale('pl', pl);

export function GameParamsPage() {
  const state = useGame();
  console.log(state);

  const [gameParams, setGameParams] = useState({
    budget: 1000_000,
    companiesCount: 5,
    startDate: '2010-01-01',
    time: '5y',
  });

  const onChange = (e: any) => {
    setGameParams({ ...gameParams, [e.target.name]: e.target.value });
  };

  const [startDate, setStartDate] = useState(new Date());

  return (
    <div className="container py-5">
      <h1>Nowa gra!</h1>
      <h4>Ustal parametry rozgrywki</h4>

      <MDBValidation className="col-md-4 d-flex flex-column gap-4 mt-16 ">
        <MDBInput
          value={gameParams.budget}
          name="budget"
          size="lg"
          onChange={onChange}
          id="validationCustom01"
          required
          label="Określ budżet startowy (PLN)"
        />

        <MDBInput
          value={gameParams.companiesCount}
          name="companiesCount"
          onChange={onChange}
          size="lg"
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

        <div className="col-12">
          <MDBBtn type="submit">Submit form</MDBBtn>
        </div>
      </MDBValidation>
    </div>
  );
}
