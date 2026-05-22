import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { MDBBtn } from 'mdb-react-ui-kit';

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

  return <MDBBtn onClick={() => login()}>Zaloguj się Google</MDBBtn>;
}
