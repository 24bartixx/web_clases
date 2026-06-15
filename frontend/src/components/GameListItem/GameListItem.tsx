import {
  MDBCol,
  MDBIcon,
  MDBListGroupItem,
  MDBRow,
} from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { ConfirmButton } from '../Common/ConfirmButton';
import type { SimulationPreview } from '../../types/Simulation';

type GameListItemProps = {
  onDelete: (simulationId: number) => void | Promise<void>;
  simulation: SimulationPreview;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDate = (value: string | null) => {
  if (value === null) {
    return 'Not set';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : dateFormatter.format(date);
};

const Metric = ({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div className="p-3 bg-opacity-25 border border-opacity-25 h-100 rounded-3 border-secondary" style={{
        backgroundColor: 'var(--bs-input-bg)',
      }} >
    <div className="mb-1 text-muted small">{label}</div>
    <div className={`fw-bold ${valueClassName}`}>{value}</div>
  </div>
);

export function GameListItem({ onDelete, simulation }: GameListItemProps) {
  const navigate = useNavigate();
  const isFinished = simulation.finishedAt !== null;
  const profitLossClass =
    simulation.profitLoss >= 0 ? 'text-success' : 'text-danger';

  const handleClick = () => {
    if (!isFinished) {
      navigate(`/game/${simulation.id}/stocks-view`);
      return;
    }

    navigate(`/game/${simulation.id}/summary`);
  };

  return (
    <MDBListGroupItem
      role="button"
      className="p-4 mb-4 shadow-sm position-relative rounded-3 border border-white/20 text-body"
      onClick={handleClick}
    >
      <div className="mb-3">
        <div className="pe-5">
          <h3 className="mb-3 h5 fw-bold">{simulation.simulationName}</h3>
          <div className="flex-wrap gap-3 d-flex align-items-center text-muted small">
            <span
              className="px-3 py-1 border border-opacity-25 rounded-pill border-secondary"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            >
              Range: {formatDate(simulation.startDate)} -{' '}
              {formatDate(simulation.finishDate)}
            </span>
            <span className="gap-2 px-3 py-1 border border-opacity-25 d-inline-flex align-items-center rounded-pill border-secondary"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            >
            {/* // className="gap-2 d-inline-flex align-items-center" */}
              <span>Current date:</span>
              <MDBIcon far icon="calendar" />
              <span className="text-body">
                {formatDate(simulation.currentDate)}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div
        className="gap-3 position-absolute d-flex align-items-center"
        style={{
          right: '1.5rem',
          top: '1.5rem',
        }}
      >
        <span
          className="px-3 py-1 rounded-pill small fw-bold"
          style={{
            backgroundColor: isFinished
              ? 'rgb(34, 94, 62)'
              : 'rgb(52, 74, 82)',
            border: '1px solid transparent',
            color: isFinished ? 'rgb(214, 255, 231)' : 'rgb(207, 230, 240)',
          }}
        >
          {isFinished ? 'Finished' : 'In progress'}
        </span>
        <ConfirmButton
          type="button"
          color="link"
          className="p-0 game-list-item__delete-button d-inline-flex align-items-center justify-content-center rounded-circle shadow-0 text-muted"
          ariaLabel={`Delete ${simulation.simulationName}`}
          title="Delete game"
          modalTitle="Delete game"
          text={`Are you sure you want to delete ${simulation.simulationName}?`}
          confirmText="Delete"
          stopPropagation
          action={() => onDelete(simulation.id)}
          style={{
            height: '2rem',
            width: '2rem',
          }}
        >
          <MDBIcon far icon="trash-alt" />
        </ConfirmButton>
      </div>

      <MDBRow className="g-3">
        <MDBCol size="12" md="6" xl="3">
          <Metric
            label="Initial balance"
            value={formatCurrency(simulation.initialBalance)}
          />
        </MDBCol>
        <MDBCol size="12" md="6" xl="3">
          <Metric
            label="Current balance"
            value={formatCurrency(simulation.currentBalance)}
          />
        </MDBCol>
        <MDBCol size="12" md="6" xl="3">
          <Metric
            label="Available funds"
            value={formatCurrency(simulation.availableFunds)}
          />
        </MDBCol>
        <MDBCol size="12" md="6" xl="3">
          <Metric
            label="Profit / loss"
            value={`${simulation.profitLoss >= 0 ? '+' : '-'}${formatCurrency(
              Math.abs(simulation.profitLoss),
            )}`}
            valueClassName={profitLossClass}
          />
        </MDBCol>
      </MDBRow>
    </MDBListGroupItem>
  );
}
