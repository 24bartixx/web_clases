import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1, 
    },
  },
});

function App(): JSX.Element {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID ?? '';

  return (
    <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
