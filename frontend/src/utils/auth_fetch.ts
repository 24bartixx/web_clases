import Cookies from 'js-cookie';

type AuthSession = {
  bearer_token?: string;
  access_token?: string;
};

function clearSessionAndRedirect() {
  Cookies.remove('user_session');
  window.location.replace('/login');
}

function getBearerToken() {
  const cookieValue = Cookies.get('user_session');
  if (!cookieValue) return null;

  try {
    const session = JSON.parse(cookieValue) as AuthSession;
    return session.bearer_token || session.access_token || null;
  } catch {
    return null;
  }
}

export async function auth_fetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const bearerToken = getBearerToken();

  if (!bearerToken) {
    clearSessionAndRedirect();
    throw new Error('Missing bearer token');
  }

  const headers = new Headers(init.headers || {});

  headers.set('Authorization', `Bearer ${bearerToken}`);

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearSessionAndRedirect();
  }

  return response;
}

