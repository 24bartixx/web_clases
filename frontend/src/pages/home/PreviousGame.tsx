import { MDBBadge, MDBBtn, MDBListGroupItem } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { SimulationPreview } from '../../types/Simulation';

type PreviousGameProps = {
  simulation: SimulationPreview;
};

export function PreviousGame({ simulation }: PreviousGameProps) {
  const navigate = useNavigate();
  return (
    <MDBListGroupItem
      noBorders
      style={{ backgroundColor: 'transparent' }}
      className="d-flex justify-content gap-2 align-items-center"
      onClick={() => navigate('/summary')}
    >
      <div>
        <div className="round-square">
          <div className="fw-bold" style={{ fontSize: '16px' }}>
            #12
          </div>
        </div>
      </div>

      <div className="d-flex flex-column">
        <div className="fw-bold">
          Rozgrywka 05.05.2026 - Steam, Amazon, Google, Microsoft, Pepsi
        </div>
        <span className="text-muted" style={{ fontSize: '10px' }}>
          Liczba transakcji: 123
        </span>
        <span className="text-muted" style={{ fontSize: '10px' }}>
          Przedział czasowy: {simulation.startDate} - {simulation.finishDate}
        </span>
      </div>
      <div className="flex-grow-1"></div>

      <div>
        <div className="round-square">
          <div className="fw-bold" style={{ fontSize: '16px' }}>
            120
          </div>
          <span className="text-muted" style={{ fontSize: '10px' }}>
            PLN
          </span>
        </div>
      </div>
      <div>
        <div className="round-square">
          <div className="text-success fw-bold" style={{ fontSize: '16px' }}>
            +50m
          </div>
          <span className="text-muted" style={{ fontSize: '10px' }}>
            PLN
          </span>
        </div>
      </div>
    </MDBListGroupItem>
  );
}
