import React, { useContext } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/AuthService';
import { AuthContext } from '../App';

const LoginForm = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  return (
    <div>
      <h1>Ingresa los datos para ingresar</h1>
      <Formik
        initialValues={{ mail: '', pass: '' }}
        validationSchema={Yup.object({
          mail: Yup.string().email('Invalid email address').required('Required'),
          pass: Yup.string().required('Required')
        })}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const response = await login(values.mail, values.pass);
            console.log('Login response:', response.data);
            if (response.data.message === 'Login successful') {
              setIsAuthenticated(true);
              navigate('/protected');
            } else {
              alert('Invalid email or password');
            }
          } catch (error) {
            console.error('Error logging in:', error);
            alert('Error logging in');
          }
          setSubmitting(false);
        }}
      >
        <Form>
          <label htmlFor="mail">Email</label>
          <Field name="mail" type="email" />
          <ErrorMessage name="mail" />

          <label htmlFor="pass">Password</label>
          <Field name="pass" type="password" />
          <ErrorMessage name="pass" />

          <button type="submit">Login</button>
        </Form>
      </Formik>
    </div>
  );
};

export default LoginForm;
