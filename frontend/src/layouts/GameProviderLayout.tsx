import { Outlet } from 'react-router-dom';
import { GameProvider } from '../contexts/GameContext';
import { GameMenu } from '../menus/gameMenu';

export function GameProviderLayout() {
  return (
    <GameProvider>
      <Outlet />
    </GameProvider>
  );
}
