import {
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBContainer,
  MDBIcon,
} from 'mdb-react-ui-kit';
import { apiUrl } from '../../utils/apiUrl';
import logo from '../../assets/logo.png';

export function LoginPage() {
  const handleLogin = async (provider: string) => {
    try {
      const response = await fetch(apiUrl(`/api/auth/authorize/${provider}`));
      const data = await response.json();

      window.location.href = data.url;
    } catch (error) {
      console.error(`Error initializing login with ${provider}:`, error);
    }
  };

  return (
    <MDBContainer className="min-vh-100 d-flex align-items-center justify-content-center px-4 py-5">
      <MDBCard
        className="w-100 border"
        style={{
          maxWidth: '440px',
          backgroundColor: 'var(--app-surface)',
          borderColor: 'var(--app-border-subtle)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--app-card-shadow)',
        }}
      >
        <MDBCardBody className="d-flex flex-column align-items-stretch gap-4 p-4 p-sm-5">
          <div className="d-flex flex-column align-items-center text-center">
            <img
              src={logo}
              alt="Chess Bross Trading"
              className="mb-3"
              style={{ height: '4rem', width: '4rem', objectFit: 'contain' }}
            />
            <p
              className="mb-2 text-uppercase fw-bold"
              style={{ color: 'var(--app-text-muted)', fontSize: '0.85rem' }}
            >
              Chess Bross Trading
            </p>
            <h1
              className="mb-2 fw-bold"
              style={{ color: 'var(--app-text-primary)' }}
            >
              Welcome back
            </h1>
            <p className="mb-0" style={{ color: 'var(--app-text-secondary)' }}>
              Sign in to continue your trading simulations
            </p>
          </div>

          <div className="d-flex flex-column gap-3 mt-2">
            <MDBBtn
              type="button"
              className="w-100 rounded-pill d-inline-flex align-items-center justify-content-center gap-3 shadow-0"
              size="lg"
              style={{
                minHeight: '3.25rem',
                backgroundColor: 'var(--app-button-primary-bg)',
                borderColor: 'var(--app-button-primary-bg)',
                color: 'var(--app-button-primary-text)',
                fontWeight: 700,
              }}
              onClick={() => handleLogin('google')}
            >
              <MDBIcon fab icon="google" />
              Continue with Google
            </MDBBtn>

            <MDBBtn
              type="button"
              outline
              className="w-100 rounded-pill d-inline-flex align-items-center justify-content-center gap-3 shadow-0"
              size="lg"
              style={{
                minHeight: '3.25rem',
                backgroundColor: 'transparent',
                borderColor: 'var(--app-text-primary)',
                color: 'var(--app-text-primary)',
                fontWeight: 700,
              }}
              onClick={() => handleLogin('github')}
            >
              <MDBIcon fab icon="github" />
              Continue with GitHub
            </MDBBtn>
          </div>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}
