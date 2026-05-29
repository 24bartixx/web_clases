import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { PortfolioPage } from '../pages/portfolio/PortfolioPage';
import { TradingViewDemoPage } from '../pages/trading_view_test/TradingViewDemoPage';
import { GameParamsPage } from '../pages/game_params/GameParamsPage';
import { GameProvider } from '../contexts/GameContext';
import { GameProviderLayout } from '../layouts/GameProviderLayout';
import { ProtectedRoute } from '../contexts/CookieData';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
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
            path: '/trading-view-test',
            element: <TradingViewDemoPage />,
          },
          {
            path: '/game-params',
            element: <GameParamsPage />,
          },
        ],
      },
    ],
  },
]);
