import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../../utils/apiUrl';
import { CustomLoading } from '../../components/Common/CustomLoading';

export function AuthCallback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthTriggered = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !provider || isAuthTriggered.current) {
      return;
    }
    isAuthTriggered.current = true;

    if (code && provider) {
      fetch(apiUrl(`/api/auth/callback/${provider}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code, state: state }),
      }).then((res) => {
        if (res.ok) navigate('/');
        else console.error('Error authenticating on backend');
      });
    }
  }, [provider, searchParams, navigate]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <CustomLoading />
    </div>
  );
}
