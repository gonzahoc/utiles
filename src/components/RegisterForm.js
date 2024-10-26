import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pages/styles.css';

const RegisterForm = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Registrate</h1>
      <Formik
        initialValues={{ nombre: '', cuil: '', empresa: '', nrosindical: '', pass: '', mail: '' }}
        validationSchema={Yup.object({
          nombre: Yup.string().required('Required'),
          cuil: Yup.string().required('Required'),
          empresa: Yup.string().required('Required'),
          nrosindical: Yup.string().required('Required'),
          pass: Yup.string().required('Required'),
          mail: Yup.string().email('Invalid email address').required('Required')
        })}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            const response = await axios.post('./api/register', values);
            alert(response.data.message);
            navigate('/login');
          } catch (error) {
            if (error.response && error.response.status === 409) {
              const duplicateField = error.response.data.error.split(' ')[1];
              setErrors({ [duplicateField]: `Este ${duplicateField} ya está registrado.` });
            } else {
              console.error('Error registering user:', error);
              alert('Error registering user');
            }
          }
          setSubmitting(false);
        }}
      >
        {({ errors }) => (
          <Form>
            <label htmlFor="nombre">Nombre</label>
            <Field name="nombre" type="text" />
            <ErrorMessage name="nombre" />

            <label htmlFor="cuil">CUIL</label>
            <Field name="cuil" type="text" />
            <ErrorMessage name="cuil" />

            <label htmlFor="empresa">Empresa</label>
            <Field name="empresa" type="text" />
            <ErrorMessage name="empresa" />

            <label htmlFor="nrosindical">Número Sindical</label>
            <Field name="nrosindical" type="text" />
            <ErrorMessage name="nrosindical" />
            {errors.nrosindical && <div className="error">{errors.nrosindical}</div>}

            <label htmlFor="mail">Email</label>
            <Field name="mail" type="email" />
            <ErrorMessage name="mail" />
            {errors.mail && <div className="error">{errors.mail}</div>}

          
            <label htmlFor="pass">Password</label>
            <Field name="pass" type="password" />
            <ErrorMessage name="pass" />


            <button type="submit" className="register-button">Registrarme</button>

          </Form>
        )}
      </Formik>
    </div>
  );
};

export default RegisterForm;
