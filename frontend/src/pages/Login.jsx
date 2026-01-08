import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentId: '',
    class: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const { login, register, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/chatrooms';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegistrationChange = (e) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      const result = await register(registrationData);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } else {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(from, { replace: true });
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setFormData({ email: '', password: '' });
    setRegistrationData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      studentId: '',
      class: '',
      role: 'student'
    });
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegistering ? 'Student Registration' : 'Student Chat Login'}</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering ? (
            // Registration form fields
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name:</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={registrationData.firstName}
                    onChange={handleRegistrationChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name:</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={registrationData.lastName}
                    onChange={handleRegistrationChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={registrationData.username}
                  onChange={handleRegistrationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={registrationData.email}
                  onChange={handleRegistrationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <div className="password-input-wrapper">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={registrationData.password}
                    onChange={handleRegistrationChange}
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="studentId">Student ID:</label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={registrationData.studentId}
                    onChange={handleRegistrationChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="class">Class:</label>
                  <input
                    type="text"
                    id="class"
                    name="class"
                    value={registrationData.class}
                    onChange={handleRegistrationChange}
                    placeholder="e.g., Computer Science 2024"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role:</label>
                <select
                  id="role"
                  name="role"
                  value={registrationData.role}
                  onChange={handleRegistrationChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="class_rep">Class Representative</option>
                </select>
              </div>
            </>
          ) : (
            // Login form fields
            <>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        <p className="toggle-mode">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={toggleMode} className="link-button">
                Login here
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={toggleMode} className="link-button">
                Register here
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;