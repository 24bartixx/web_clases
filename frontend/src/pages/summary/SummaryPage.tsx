import { MDBBtn } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';

export function SummaryPage() {
  const navigate = useNavigate();

  return (
    <div className="d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3">
      <h1>Summary</h1>
      <MDBBtn onClick={() => navigate('/')}>Back home</MDBBtn>
    </div>
  );
}
