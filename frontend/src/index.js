import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import reportWebVitals from './reportWebVitals';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme, { buildThemeFromCssVars } from './theme';

import './theme/dark.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

function ThemeLoaderApp() {
  const [muiTheme, setMuiTheme] = React.useState(null);

  React.useEffect(() => {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    setMuiTheme(buildThemeFromCssVars());
  }, []);

  if (!muiTheme) return null;

  return (
    <GoogleOAuthProvider
      clientId={String(process.env.REACT_APP_GOOGLE_CLIENT_ID)}
    >
      <React.StrictMode>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <RouterProvider router={router} />
        </ThemeProvider>
      </React.StrictMode>
    </GoogleOAuthProvider>
  );
}

root.render(<ThemeLoaderApp />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
