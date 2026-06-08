import { apiUrl } from '../config/api';
import type { SimulationDetailResponse } from '../mappers/simulationMapper';
import {
  mapSimulationDtoToSimulationPreview,
  type SimulationDto,
  type SimulationPreview,
} from '../types/Simulation';
import { auth_fetch } from '../utils/auth_fetch';

export type CreateSimulationRequest = {
  simulationName: string;
  startingBudget: number;
  stockIds: number[];
  startDate: string;
  finishDate: string;
};

const readErrorMessage = async (
  response: Response,
  fallbackMessage: string,
) => {
  const errorMessage = await response.text();
  return errorMessage || fallbackMessage;
};

export async function createSimulation(
  simulation: CreateSimulationRequest,
): Promise<SimulationDetailResponse> {
  const response = await auth_fetch(apiUrl('/simulation/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      simulation_name: simulation.simulationName || null,
      initial_balance: simulation.startingBudget,
      start_date: simulation.startDate || null,
      finish_date: simulation.finishDate || null,
      stock_ids: simulation.stockIds,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to create simulation'),
    );
  }

  return response.json();
}

export async function getSimulationList(): Promise<SimulationPreview[]> {
  const response = await auth_fetch(apiUrl('/simulation/'));

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to get simulations'),
    );
  }

  const data: SimulationDto[] = await response.json();
  return data.map(mapSimulationDtoToSimulationPreview);
}

export async function getSimulation(
  simulationId: number,
): Promise<SimulationDetailResponse> {
  const response = await auth_fetch(apiUrl(`/simulation/${simulationId}`));

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to get simulation'),
    );
  }

  return response.json();
}

export async function deleteSimulation(simulationId: number): Promise<void> {
  const response = await auth_fetch(apiUrl(`/simulation/${simulationId}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to delete simulation'),
    );
  }
}

export async function advanceSimulationTurn(
  simulationId: number,
  days: number,
): Promise<SimulationDetailResponse> {
  const response = await auth_fetch(
    apiUrl(`/simulation/${simulationId}/advance-turn`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ days }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to advance simulation turn'),
    );
  }

  return response.json();
}

export async function finishSimulation(
  simulationId: number,
  finishedAt: string,
): Promise<void> {
  const response = await auth_fetch(apiUrl(`/simulation/${simulationId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ finished_at: finishedAt }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Failed to finish simulation'),
    );
  }
}
