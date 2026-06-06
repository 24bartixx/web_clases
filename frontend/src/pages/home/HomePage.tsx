import {
  MDBBtn,
  MDBIcon,
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
import './HomePage.css';

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
    <MDBContainer className="pt-3 pb-5">
      <MDBRow className="home-hero align-items-center g-4 mb-5">
        <MDBCol size="12" className="home-hero__copy">
          <p className="home-hero__eyebrow">Trading dashboard</p>
          <div className="home-hero__title-row">
            <div className="home-hero__avatar">
              <img
                src={userInfo?.picture || defaultAvatar}
                className="img-fluid rounded-circle"
                alt="User Avatar"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="home-hero__title">
              Hello, {userInfo?.first_name || 'Chess Bro'}!
            </h1>
          </div>
          <p className="home-hero__subtitle">Start a new simulation</p>
          <MDBBtn
            rounded
            className="home-hero__button"
            size="lg"
            onClick={() => navigate('/game-params')}
          >
            <MDBIcon fas icon="plus" className="me-3" />
            New game
          </MDBBtn>
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
