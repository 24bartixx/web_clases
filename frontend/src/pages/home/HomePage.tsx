import {
  MDBBtn,
  MDBListGroup,
  MDBContainer,
  MDBRow,
  MDBCol,
} from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { PreviousGame } from './PreviousGame';
import { getUserSession } from '../../contexts/CookieData';

export function HomePage() {
  const navigate = useNavigate();
  const userSession = getUserSession();

  const defaultAvatar =
    'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

  return (
    <MDBContainer className="py-5">
      <MDBRow className="align-items-center justify-content-center gx-5 mb-5">
        <MDBCol
          size="auto"
          className="d-flex flex-column align-items-start gap-2"
        >
          <h1 style={{ fontWeight: '600' }}>
            Cześć {userSession?.first_name || 'Chess Bro'}!
          </h1>
          <MDBBtn
            rounded
            className="p-lg-4 rounded-pill"
            size="lg"
            onClick={() => navigate('/game-params')}
          >
            Rozpocznij nową grę!
          </MDBBtn>
        </MDBCol>

        <MDBCol size="auto">
          <img
            src={userSession?.picture || defaultAvatar}
            className="img-fluid rounded-circle"
            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            alt="User Avatar"
            referrerPolicy="no-referrer"
          />
        </MDBCol>
      </MDBRow>

      <MDBRow>
        <MDBCol>
          <h1 className="mb-3">Historia poprzednich rozgrywek</h1>
          <MDBListGroup>
            {Array.from({ length: 5 }, (_, i) => (
              <PreviousGame key={i} />
            ))}
          </MDBListGroup>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
}
