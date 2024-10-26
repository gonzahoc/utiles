import React from 'react';
import { useNavigate } from 'react-router-dom';
import  myLogo from '../images/logofull.png' ;
const HomePage = () => {
  const navigate = useNavigate();
  document.title = 'STIPA - Sistema de Turnos para retiro utiles escolares';
  const goToLogin = () => {
    navigate('/login');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="home">
      <img src={myLogo} alt="STIPA" className="imagen-ajustada"/>
      <h1>STIPA - Sistema de Turnos para retirar utiles escolares - STIPA</h1>
      <p>Bienvenido, si necesitas ayuda contactate al mail xxxx@xxx.com o manda whatsapp al +5311XXXXXX</p>
      <button onClick={goToLogin} className="boton-login">Entrar al Sistema</button>
      <button onClick={goToRegister} className="boton-registrar">Sos nuevo? Registrate aca</button>
    </div>
  );
};

export default HomePage;
