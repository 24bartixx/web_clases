import { MDBBtn, MDBIcon, MDBListGroup } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import UserImg from '../../assets/userPhoto.png';
import { PreviousGame } from './PreviousGame';

export function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="container py-5">
      <div className="d-flex flex-row align-items-center justify-content-center gap-5 mb-5">
        <div className="d-flex flex-column align-items-start gap-2">
          <h1 style={{ fontWeight: '600' }}>Cześć Chess Bro!</h1>
          <MDBBtn
            rounded
            className="p-lg-4 rounded-pill"
            size="lg"
            onClick={() => navigate('/game-details')}
          >
            Rozpocznij nową grę!
          </MDBBtn>
        </div>
        <div>
          <img
            src={UserImg}
            className="img-fluid rounded-circle"
            style={{ maxWidth: '150px' }}
            alt="User"
          />
        </div>
      </div>

      <div className="d-flex flex-column">
        <h1> &emsp;&emsp;Historia poprzednich rozgrywek</h1>
        <MDBListGroup>
          {Array.from({ length: 5 }, (_, i) => (
            <PreviousGame key={i} />
          ))}
        </MDBListGroup>
      </div>
    </div>
  );
}
