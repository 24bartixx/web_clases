import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "../pages/home/HomePage.tsx";
import { LoginPage } from "../pages/login/LoginPage.tsx";
import { PortfolioPage } from "../pages/portfolio/PortfolioPage.tsx";
import { TradingViewDemoPage } from "../pages/trading_view_test/TradingViewDemoPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/portfolio",
    element: <PortfolioPage />,
  },
  {
    path: "/trading-view-test",
    element: <TradingViewDemoPage />,
  },
]);
