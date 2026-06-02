import { MDBBtn, MDBInput, MDBValidation } from 'mdb-react-ui-kit';
import { CompanyMultiSelect } from './CompanyMultiSelect';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale/pl';
import { useGame } from '../../contexts/GameContext';
registerLocale('pl', pl);

interface GameParams {
  budget: number;
  startDate: string;
  endDate: string;
  companiesTickets: string[];
}

export function GameParamsPage() {
  const { gameState, createGame } = useGame();
  console.log(gameState);

  const [gameParams, setGameParams] = useState<GameParams>({
    budget: 1000_000,
    startDate: '2010-01-01',
    endDate: '2015-01-01',
    companiesTickets: [],
  });

  const ALL_COMPANIES = [
    { id: '1', name: 'Apple Inc.' },
    { id: '2', name: 'Microsoft' },
    { id: '3', name: 'Google' },
    { id: '4', name: 'Amazon' },
    { id: '5', name: 'Tesla' },
    { id: '6', name: 'Nvidia' },
  ];

  const selectedIds = gameParams.companiesTickets || [];

  const handleSelect = (companyId: string) => {
    setGameParams({
      ...gameParams,
      companiesTickets: [...selectedIds, companyId],
    });
  };

  const handleRemove = (companyId: string) => {
    setGameParams({
      ...gameParams,
      companiesTickets: selectedIds.filter((id) => id !== companyId),
    });
  };

  const onChange = (e: any) => {
    setGameParams({ ...gameParams, [e.target.name]: e.target.value });
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    console.log('onSubmit');
    createGame({
      startingBudget: gameParams.budget,
      companiesTickets: gameParams.companiesTickets,
      startDate: gameParams.startDate,
      finishDate: gameParams.endDate,
    });
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
          value={gameParams.startDate}
          name="startDate"
          size="lg"
          type="date"
          onChange={onChange}
          id="validationCustom02"
          required
          label="Określ datę rozpoczęcia"
        />

        <MDBInput
          value={gameParams.endDate}
          name="endDate"
          size="lg"
          type="date"
          onChange={onChange}
          id="validationCustom03"
          required
          label="Określ datę zakończenia"
        />

        <div className="col-12">
          <MDBBtn type="submit">Submit form</MDBBtn>
        </div>
      </MDBValidation>
    </div>
  );
}
