/**
 * Fetch wrapper that automatically sends httpOnly cookies.
 * Browser sends cookies with credentials: 'include'.
 * Redirects to /login on 401.
 */
export async function auth_fetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
  });

  if (response.status === 401) {
    window.location.replace('/login');
  }

  return response;
}
