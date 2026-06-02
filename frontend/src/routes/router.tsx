import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { PortfolioPage } from '../pages/portfolio/PortfolioPage';
import { TradingViewPage } from '../pages/trading_view/TradingViewPage';
import { GameParamsPage } from '../pages/game_params/GameParamsPage';
import { GameProvider } from '../contexts/GameContext';
import { GameProviderLayout } from '../layouts/GameProviderLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    element: <GameProviderLayout />,
    children: [
      {
        path: '/portfolio',
        element: <PortfolioPage />,
      },
      {
        path: '/trading-view/:ticker',
        element: <TradingViewPage />,
      },
      {
        path: '/game-params',
        element: <GameParamsPage />,
      },
    ],
  },
]);
