import React, { useContext } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { login as loginService, testAPI } from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      mail: '',
      pass: ''
    },
    validationSchema: Yup.object({
      mail: Yup.string().email('Invalid email address').required('Required'),
      pass: Yup.string().required('Required')
    }),
    onSubmit: async (values, { setSubmitting }) => {
      console.log('Formulario enviado:', values); // Log para verificar el envío
      try {
        const response = await loginService(values.mail, values.pass);
        console.log('Login response:', response);
        alert(response.data.message);
        
        // Almacenar el token
        localStorage.setItem('token', response.data.token);
        login(response.data.user); // Usa la función login del contexto
        navigate('/protected'); // Redirigir a una página protegida
      } catch (error) {
        console.error('Error logging in:', error.response || error); // Log para el error
        alert('Error al iniciar sesión');
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <div className= "login">
      <h2>Login</h2>
      <form onSubmit={formik.handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="mail"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.mail}
          />
          {formik.touched.mail && formik.errors.mail ? <div>{formik.errors.mail}</div> : null}
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="pass"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.pass}
          />
          {formik.touched.pass && formik.errors.pass ? <div>{formik.errors.pass}</div> : null}
        </div>
        <button type="submit" disabled={formik.isSubmitting}>Login</button>
      </form>
        
    </div>
  );
};

export default LoginPage;
