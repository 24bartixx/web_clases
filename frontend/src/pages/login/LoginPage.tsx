import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { apiUrl } from '../../utils/apiUrl';

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
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="d-flex flex-column gap-3">
        <h2>Login with</h2>

        <MDBBtn
          rounded
          className="rounded-pill"
          size="lg"
          onClick={() => handleLogin('google')}
        >
          <MDBIcon fab icon="google" /> Google
        </MDBBtn>

        <MDBBtn
          rounded
          className="rounded-pill"
          color="dark"
          size="lg"
          onClick={() => handleLogin('github')}
        >
          <MDBIcon fab icon="github" /> GitHub
        </MDBBtn>
      </div>
    </div>
  );
}
