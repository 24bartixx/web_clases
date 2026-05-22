import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';

export function LoginPage() {
  const login = useGoogleLogin({
    flow: 'implicit', // albo 'auth-code' zależnie od backendu
    onSuccess: async (tokenResponse) => {
      console.log('Token response:', tokenResponse);

      // jeśli potrzebujesz user info:
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      const user = await res.json();

      console.log('Imię:', user.given_name);
      console.log('Nazwisko:', user.family_name);
      console.log('Email:', user.email);
      console.log('ID:', user.sub);
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
