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
import { apiUrl } from '../../utils/apiUrl';
import { auth_fetch } from '../../utils/auth_fetch';
import { getUserInfo } from '../../api/userApi';
import type { UserInfo } from '../../api/userApi';
import {
  mapSimulationDtoToSimulationPreview,
  SimulationPreview,
} from '../../types/Simulation';

export function HomePage() {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userSimulationsPreviews, setUserSimulationsPreviews] = useState<
    SimulationPreview[]
  >([]);

  const defaultAvatar =
    'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setUserInfo(await getUserInfo());
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchUserSimulationsPreviews = async () => {
      try {
        const response = await auth_fetch(apiUrl('/api/simulation/'));
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
            Hello {userInfo?.first_name || 'Chess Bro'}!
          </h1>
          <MDBBtn
            rounded
            className="p-lg-4 rounded-pill"
            size="lg"
            onClick={() => navigate('/game-params')}
          >
            New game
          </MDBBtn>
        </MDBCol>

        <MDBCol size="auto">
          <img
            src={userInfo?.picture || defaultAvatar}
            className="img-fluid rounded-circle"
            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            alt="User Avatar"
            referrerPolicy="no-referrer"
          />
        </MDBCol>
      </MDBRow>

      <MDBRow>
        <MDBCol>
          <h1 className="mb-3">Games</h1>
          {userSimulationsPreviews.length === 0 ? (
            <p>No games yet... Start a new game!</p>
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
