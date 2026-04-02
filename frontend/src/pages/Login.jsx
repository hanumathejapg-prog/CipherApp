import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { googleLoginUrl } from '../services/AuthService';

const Login = () => {
  const navigate = useNavigate();
  const { token, loading } = useAuth();

  // If already logged in, redirect to home
  useEffect(() => {
    if (!loading && token) {
      navigate('/home', { replace: true });
    }
  }, [token, loading, navigate]);

  if (loading) {
    return <div className="auth-page">Checking login status...</div>;
  }

  return (
    <div className="auth-page">
      <h1>Cipher</h1>
      <a className="google-btn" href={googleLoginUrl}>
        Login with Google
      </a>
    </div>
  );
};

export default Login;
