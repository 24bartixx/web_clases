import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage';
import { LoginPage } from '../pages/login/LoginPage';
import { PortfolioPage } from '../pages/portfolio/PortfolioPage';
import { TradingViewDemoPage } from '../pages/trading_view_test/TradingViewDemoPage';
import { GameParamsPage } from '../pages/game_params/GameParamsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
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
]);
