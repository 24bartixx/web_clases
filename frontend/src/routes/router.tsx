import { Navigate, createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { PortfolioPage } from '../pages/portfolio/PortfolioPage';
import { TradingViewPage } from '../pages/trading_view/TradingViewPage';
import { GameParamsPage } from '../pages/game_params/GameParamsPage';
import { GameProviderLayout } from '../layouts/GameProviderLayout';
import { StocksViewPage } from '../pages/stocks_view/StocksViewPage';
import { GameProcessLayout } from '../layouts/GameProcessLayout';
import { SummaryPage } from '../pages/summary/SummaryPage';
import { AuthCallback } from '../pages/login/AuthCallback';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    // :provider for both google and github
    path: '/auth/callback/:provider',
    element: <AuthCallback />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    element: <GameProviderLayout />,
    children: [
      {
        path: '/game-params',
        element: <GameParamsPage />,
      },
      {
        path: '/game',
        element: <Navigate to="/" replace />,
      },
      {
        path: '/game/:simulationId/summary',
        element: <SummaryPage />,
      },
      {
        path: '/game/:simulationId',
        element: <GameProcessLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="stocks-view" replace />,
          },
          {
            path: 'portfolio',
            element: <PortfolioPage />,
          },
          {
            path: 'stocks-view',
            element: <StocksViewPage />,
          },
          {
            path: 'trading-view/:ticker',
            element: <TradingViewPage />,
          },
        ],
      },
    ],
  },
]);
