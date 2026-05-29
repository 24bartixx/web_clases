import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      console.log('Token response:', tokenResponse);
      const accessToken = tokenResponse.access_token;

      try {
        const response = await fetch('http://localhost:8000/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: accessToken }),
        });
        if (!response.ok) {
          throw new Error('Błąd podczas wysyłania POST');
        }
        const data = await response.json();

        Cookies.set('user_session', JSON.stringify(data), {
          expires: 1,
          secure: true,
          sameSite: 'strict',
        });
        navigate('/');
      } catch (error) {
        console.error('Błąd POST:', error);
      }
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="d-flex flex-column align-items-center justify-content-center gap-3">
        <h2 className="mb-1">Zaloguj się</h2>
        <MDBBtn
          rounded
          className="mx-2 rounded-pill"
          size="lg"
          onClick={() => login()}
        >
          <MDBIcon fab icon="google" />
          &nbsp; Zaloguj się Google
        </MDBBtn>
      </div>
    </div>
  );
}
