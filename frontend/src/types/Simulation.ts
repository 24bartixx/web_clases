export interface SimulationPreview {
  id: number;
  initialBalance: number;
  currentBalance: number;
  availableFunds: number;
  profitLoss: number;
  startDate: string;
  finishDate: string | null;
  currentDate: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationDto {
  initial_balance: string;
  start_date: string;
  finish_date: string | null;
  user_id: number;
  simulation_id: number;
  current_balance: string;
  available_funds: string;
  profit_loss: string;
  current_date: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapSimulationDtoToSimulationPreview(
  dto: SimulationDto,
): SimulationPreview {
  return {
    id: dto.simulation_id,
    initialBalance: Number(dto.initial_balance),
    currentBalance: Number(dto.current_balance),
    availableFunds: Number(dto.available_funds),
    profitLoss: Number(dto.profit_loss),
    startDate: dto.start_date,
    finishDate: dto.finish_date,
    currentDate: dto.current_date,
    finishedAt: dto.finished_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}
