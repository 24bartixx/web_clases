import { useGoogleLogin } from '@react-oauth/google';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../utils/apiUrl';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      console.log('Token response:', tokenResponse);
      const accessToken = tokenResponse.access_token;

      try {
        const response = await fetch(apiUrl('/api/users/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ access_token: accessToken }),
        });
        if (!response.ok) {
          throw new Error('Login failed');
        }
        // Backend sets httpOnly cookie, redirect to home
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
      }
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="d-flex flex-column align-items-center justify-content-center gap-3">
        <h2 className="mb-1">Sign in with Google</h2>
        <MDBBtn
          rounded
          className="mx-2 rounded-pill"
          size="lg"
          onClick={() => login()}
        >
          <MDBIcon fab icon="google" />
          &nbsp; Sign in with Google
        </MDBBtn>
      </div>
    </div>
  );
}
