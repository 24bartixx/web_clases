import { useEffect } from 'react';
import { MDBContainer, MDBSpinner } from 'mdb-react-ui-kit';
import { Navigate, Outlet, useParams } from 'react-router';
import { GameMenu } from '../menus/gameMenu';
import { useGame } from '../contexts/GameContext';

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
      <>
        <GameMenu />
        <MDBContainer className="d-flex justify-content-center align-items-center vh-100">
          <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
          <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
          <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
          <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        </MDBContainer>
      </>
    );
  }

  return (
    <>
      <GameMenu />
      <Outlet />
    </>
  );
}
