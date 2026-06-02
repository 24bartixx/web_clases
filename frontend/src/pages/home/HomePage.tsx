import {
  MDBBtn,
  MDBListGroup,
  MDBContainer,
  MDBRow,
  MDBCol,
} from 'mdb-react-ui-kit';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PreviousGame } from './PreviousGame';
import { getUserSession } from '../../contexts/CookieData';
import { auth_fetch } from '../../utils/auth_fetch';
import {
  mapSimulationDtoToSimulationPreview,
  SimulationPreview,
} from '../../types/Simulation';

export function HomePage() {
  const navigate = useNavigate();
  const userSession = getUserSession();

  const defaultAvatar =
    'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

  const [userSimulationsPreviews, setUserSimulationsPreviews] = useState<
    SimulationPreview[]
  >([]);

  useEffect(() => {
    const fetchUserSimulationsPreviews = async () => {
      try {
        const response = await auth_fetch(
          'http://localhost:8000/api/simulation/',
        );
        const data = await response.json();

        const simulations = data.map(mapSimulationDtoToSimulationPreview);
        setUserSimulationsPreviews(simulations);

        console.log('auth_fetch result:', data);
      } catch (error) {
        console.error('auth_fetch error:', error);
      }
    };

    fetchUserSimulationsPreviews();
  }, []);

  return (
    <MDBContainer className="py-5">
      <MDBRow className="align-items-center justify-content-center gx-5 mb-7">
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
          {userSimulationsPreviews.length === 0 ? (
            <p>Nie masz jeszcze żadnych rozgrywek. Zacznij nową grę!</p>
          ) : (
            <MDBListGroup>
              {userSimulationsPreviews.map((simulation) => (
                <PreviousGame key={simulation.id} simulation={simulation} />
              ))}
            </MDBListGroup>
          )}
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
}
