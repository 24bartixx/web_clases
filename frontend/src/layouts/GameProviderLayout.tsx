import { Outlet } from 'react-router-dom';
import { GameProvider } from '../contexts/GameContext';

export function GameProviderLayout() {
  return (
    <GameProvider>
      <Outlet />
    </GameProvider>
  );
}
