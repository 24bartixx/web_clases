import { Outlet } from 'react-router';
import { GameMenu } from '../menus/gameMenu';

export function GameProcessLayout() {
  return (
    <>
      <GameMenu />
      <Outlet />
    </>
  );
}
