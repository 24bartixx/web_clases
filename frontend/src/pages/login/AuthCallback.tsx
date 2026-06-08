import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../../utils/apiUrl';

export function AuthCallback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code && provider) {
      fetch(apiUrl(`/api/auth/callback/${provider}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code }),
      }).then((res) => {
        if (res.ok) navigate('/');
        else console.error('Error authenticating on backend');
      });
    }
  }, [provider, searchParams, navigate]);

  return <div>Logging in with {provider}, please wait...</div>;
}
