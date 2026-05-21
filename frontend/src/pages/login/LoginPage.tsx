import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Button from '@mui/material/Button';

export function LoginPage() {
  return (
    <div>
      <Button variant="contained">Hello world</Button>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const decoded: any = jwtDecode(credentialResponse.credential!);
          console.log('Imię:', decoded.given_name);
          console.log('Nazwisko:', decoded.family_name);
          console.log('Email:', decoded.email);
          console.log('ID:', decoded.sub);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </div>
  );
}
