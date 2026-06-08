import { useEffect } from 'react';
import { MDBContainer, MDBSpinner } from 'mdb-react-ui-kit';
import { Navigate, Outlet, useParams } from 'react-router';
import { GameMenu } from '../menus/gameMenu';
import { useGame } from '../contexts/GameContext';
import { CustomLoading } from '../components/Common/CustomLoading';

export function GameProcessLayout() {
  const { simulationId } = useParams<{ simulationId: string }>();
  const { gameState, resumeGame } = useGame();
  const parsedSimulationId =
    simulationId === undefined ? NaN : Number(simulationId);
  const isValidSimulationId = Number.isInteger(parsedSimulationId);
  const isLoadedSimulation = gameState.simulationId === parsedSimulationId;

  useEffect(() => {
    if (
      !isValidSimulationId ||
      isLoadedSimulation ||
      gameState.status === 'loading'
    ) {
      return;
    }

    resumeGame(parsedSimulationId);
  }, [
    gameState.status,
    isLoadedSimulation,
    isValidSimulationId,
    parsedSimulationId,
    resumeGame,
  ]);

  if (!isValidSimulationId) {
    return <Navigate to="/" replace />;
  }

  if (!isLoadedSimulation && gameState.status !== 'error') {
    return (
      <div className="min-vh-100 d-flex flex-column">
        <GameMenu />
        <main className="flex-grow-1 d-flex flex-column">
          <MDBContainer className="flex-grow-1 d-flex justify-content-center align-items-center">
            <CustomLoading />
          </MDBContainer>
        </main>
      </div>
    );
  }

  if (isLoadedSimulation && gameState.finishedAt !== null) {
    return <Navigate to={`/game/${parsedSimulationId}/summary`} replace />;
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <GameMenu />
      <main className="flex-grow-1 d-flex flex-column">
        <Outlet />
      </main>
    </div>
  );
}
