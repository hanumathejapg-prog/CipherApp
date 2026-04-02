import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuth2Redirect = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    console.log('OAuth2Redirect - Current URL:', window.location.href);
    console.log('OAuth2Redirect - Token from URL:', token ? 'Found' : 'Not found');
    
    if (token) {
      console.log('OAuth2Redirect - Storing token and navigating to /home');
      loginWithToken(token);
      // Give Auth context a moment to process the token
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 100);
      return;
    }
    
    console.error('OAuth2Redirect - No token in URL, redirecting to login');
    navigate('/', { replace: true });
  }, [loginWithToken, navigate]);

  return (
    <div className="auth-page">
      <div>Processing login...</div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
        If you're stuck here, there may be an issue with OAuth configuration.
        <br />
        Check browser console (F12) for errors.
      </div>
    </div>
  );
};

export default OAuth2Redirect;
