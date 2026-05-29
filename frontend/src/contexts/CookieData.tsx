import Cookies from 'js-cookie';
import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const session = Cookies.get('user_session');

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Jeśli sesja istnieje, renderujemy komponenty dziecięce (dzięki Outlet)
  return <Outlet />;
}

export interface UserSession {
  user_id: number;
  google_id: string | null;
  first_name: string;
  last_name: string;
  picture: string | null;
  created_at: string;
}

export function getUserSession(): UserSession | null {
  const cookieData = Cookies.get('user_session');

  if (!cookieData) return null;

  try {
    return JSON.parse(cookieData) as UserSession;
  } catch (error) {
    return null;
  }
}
