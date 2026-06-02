export interface SimulationPreview {
  id: number;
  initialBalance: number;
  currentBalance: number;
  startDate: string;
  finishDate: string | null;
}

export interface SimulationDto {
  initial_balance: string;
  start_date: string;
  finish_date: string | null;
  user_id: number;
  simulation_id: number;
  current_balance: string;
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
    startDate: dto.start_date,
    finishDate: dto.finish_date,
  };
}
