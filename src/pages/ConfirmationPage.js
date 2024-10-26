import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const ConfirmationPage = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="container">
      <h1>Solicitud Enviada</h1>
      <p>
        Su solicitud fue cargada con éxito, espere a que validen los datos en administración y le responderemos a la brevedad con un número de turno y fecha de retiro.
        <br />
        ¡Muchas gracias!
      </p>
      <button onClick={handleBackToLogin}>Volver al Inicio de Sesión</button>
    </div>
  );
};

export default ConfirmationPage;
