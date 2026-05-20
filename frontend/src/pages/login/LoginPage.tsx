import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export function LoginPage() {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        const decoded: any = jwtDecode(credentialResponse.credential!);
        console.log("Imię:", decoded.given_name);
        console.log("Nazwisko:", decoded.family_name);
        console.log("Email:", decoded.email);
        console.log("ID:", decoded.sub);
      }}
      onError={() => {
        console.log("Login Failed");
      }}
    />
  );
}
