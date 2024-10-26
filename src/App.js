import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedPage from './pages/ProtectedPage';
import HomePage from './pages/HomePage';
import ConfirmationPage from './pages/ConfirmationPage'; // Importar la nueva página de confirmación
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles.css';

const App = () => {
  return (
    <AuthProvider>
      <Router basename = {'/'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/protected" 
            element={
              <PrivateRoute>
                <ProtectedPage />
              </PrivateRoute>
            } 
          />
          <Route path="/confirmation" element={<ConfirmationPage />} /> {/* Añadir la ruta de confirmación */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default App;
