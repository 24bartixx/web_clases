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
import { GameListItem } from '../../components/GameListItem';
import { deleteSimulation, getSimulationList } from '../../api/simulationApi';
import { getUserInfo } from '../../api/userApi';
import type { UserInfo } from '../../api/userApi';
import type { SimulationPreview } from '../../types/Simulation';
import { CustomLoading } from '../../components/Common/CustomLoading';
import logo from '../../assets/logo.png';
import { apiUrl } from '../../utils/apiUrl';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userSimulationsPreviews, setUserSimulationsPreviews] = useState<
    SimulationPreview[]
  >([]);
  const [areSimulationsLoading, setAreSimulationsLoading] = useState(true);

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
      setAreSimulationsLoading(true);
      try {
        setUserSimulationsPreviews(await getSimulationList());
      } catch (error) {
        console.error('Failed to fetch simulations:', error);
      } finally {
        setAreSimulationsLoading(false);
      }
    };

    fetchUserSimulationsPreviews();
  }, []);

  const handleDeleteSimulation = async (simulationId: number) => {
    try {
      await deleteSimulation(simulationId);
      setUserSimulationsPreviews((simulations) =>
        simulations.filter((simulation) => simulation.id !== simulationId),
      );
    } catch (error) {
      console.error('Failed to delete simulation:', error);
      alert('Could not delete game.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigate('/login');
    }
  };

  return (
    <MDBContainer fluid className="pt-3 pb-5 px-0">
      <MDBRow className="home-hero align-items-center g-0 mb-5 mx-0">
        <MDBCol size="12" className="home-hero__copy px-0">
          <div className="home-page-section home-page-section--hero">
            <div className="home-hero__top-row">
              <div className="home-hero__brand">
                <img src={logo} alt="Chess Bross Trading logo" />
                <span>Chess Bross Trading</span>
              </div>

              <MDBBtn
                color="light"
                outline
                className="home-hero__logout-btn"
                onClick={handleLogout}
              >
                Log out
              </MDBBtn>
            </div>
            <div className="flex flex-row justify-between items-start">
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
              {/* <p className="home-hero__subtitle">Start a new simulation</p> */}
              <MDBBtn
                rounded
                className="home-hero__button"
                size="sm"
                onClick={() => navigate('/game-params')}
              >
                <MDBIcon fas icon="plus" className="me-3" />
                New game
              </MDBBtn>
            </div>
          </div>
        </MDBCol>
      </MDBRow>

      <MDBRow className="g-0 mx-0">
        <MDBCol className="px-0">
          <div className="home-page-section">
            <h2 className="mb-3">Games</h2>
            {areSimulationsLoading ? (
              <div className="d-flex justify-content-center py-5">
                <CustomLoading />
              </div>
            ) : userSimulationsPreviews.length === 0 ? (
              <p>No games yet... Start a new game!</p>
            ) : (
              <MDBListGroup className="d-flex flex-column gap-3 bg-transparent">
                {userSimulationsPreviews.map((simulation) => (
                  <GameListItem
                    key={simulation.id}
                    simulation={simulation}
                    onDelete={handleDeleteSimulation}
                  />
                ))}
              </MDBListGroup>
            )}
          </div>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
}
