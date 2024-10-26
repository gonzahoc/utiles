import React, { useState, useEffect } from 'react';
import { Formik, Field, Form, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProtectedPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [formId, setFormId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const [previewValues, setPreviewValues] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android|iPad|iPhone|iPod/i.test(userAgent)) {
      setIsMobile(true);
    }
  }, []);

  const initialValues = {
    nombre: '',
    telefono: '',
    email: user ? user.mail || '' : '',
    reciboSueldo: null,
    dniFrente: null,
    dniDorso: null,
    carnetSindicalFrente: null,
    carnetSindicalDorso: null,
    hijos: [{
      apellidoynombre: '',
      edad: '',
      ciclolectivo: '',
      escuela: '',
      estatal: false,
      privada: false,
      talleguardapolvo: '',
      dnifrente: null,
      dnidorso: null,
      constanciaBoletin: null
    }]
  };

  const validationSchema = Yup.object({
    nombre: Yup.string().required('Required'),
    telefono: Yup.string().required('Required'),
    email: Yup.string().email('Email inválido').required('Required'),
    hijos: Yup.array().of(
      Yup.object().shape({
        apellidoynombre: Yup.string().required('Required'),
        edad: Yup.number().required('Required'),
        ciclolectivo: Yup.string().required('Required'),
        escuela: Yup.string().required('Required'),
        estatal: Yup.boolean().required('Required'),
        privada: Yup.boolean().required('Required'),
        dnifrente: Yup.mixed().required('Required'),
        dnidorso: Yup.mixed().required('Required'),
        constanciaBoletin: Yup.mixed().required('Required')
      })
    )
  });

  const handlePreview = (values) => {
    setPreviewValues(values); // Guardar los valores del formulario

    const preview = `
      <h2>Información del Usuario</h2>
      <p><strong>Nombre:</strong> ${values.nombre}</p>
      <p><strong>Teléfono:</strong> ${values.telefono}</p>
      <p><strong>Email:</strong> ${values.email}</p>
      <h3>Archivos Adjuntos del Usuario</h3>
      <div>
        ${values.reciboSueldo ? `<img src="${URL.createObjectURL(values.reciboSueldo)}" alt="Recibo Sueldo" width="150" />` : ''}
        ${values.dniFrente ? `<img src="${URL.createObjectURL(values.dniFrente)}" alt="DNI Frente" width="150" />` : ''}
        ${values.dniDorso ? `<img src="${URL.createObjectURL(values.dniDorso)}" alt="DNI Dorso" width="150" />` : ''}
      </div>
      <h3>Información de los Hijos</h3>
      ${values.hijos.map((hijo, index) => `
        <h4>Hijo ${index + 1}</h4>
        <p><strong>Apellido y Nombre:</strong> ${hijo.apellidoynombre}</p>
        <p><strong>Edad:</strong> ${hijo.edad}</p>
        <p><strong>Escuela:</strong> ${hijo.escuela}</p>
        <div>
          ${hijo.dnifrente ? `<img src="${URL.createObjectURL(hijo.dnifrente)}" alt="DNI Frente Hijo" width="150" />` : ''}
          ${hijo.dnidorso ? `<img src="${URL.createObjectURL(hijo.dnidorso)}" alt="DNI Dorso Hijo" width="150" />` : ''}
          ${hijo.constanciaBoletin ? `<img src="${URL.createObjectURL(hijo.constanciaBoletin)}" alt="Constancia Boletín" width="150" />` : ''}
        </div>
      `).join('')}
    `;
    setPreviewEmail(preview);
    setShowPreview(true);
  };

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append('nombre', values.nombre);
    formData.append('telefono', values.telefono);
    formData.append('mail', values.email);
    formData.append('reciboSueldo', values.reciboSueldo);
    formData.append('dniFrente', values.dniFrente);
    formData.append('dniDorso', values.dniDorso);
    formData.append('carnetSindicalFrente', values.carnetSindicalFrente);
    formData.append('carnetSindicalDorso', values.carnetSindicalDorso);

    values.hijos.forEach((hijo, index) => {
      formData.append(`hijos[${index}].apellidoynombre`, hijo.apellidoynombre);
      formData.append(`hijos[${index}].edad`, hijo.edad);
      formData.append(`hijos[${index}].ciclolectivo`, hijo.ciclolectivo);
      formData.append(`hijos[${index}].escuela`, hijo.escuela);
      formData.append(`hijos[${index}].estatal`, hijo.estatal);
      formData.append(`hijos[${index}].privada`, hijo.privada);
      formData.append(`hijos[${index}].talleguardapolvo`, hijo.talleguardapolvo);
      formData.append(`hijos[${index}].dnifrente`, hijo.dnifrente);
      formData.append(`hijos[${index}].dnidorso`, hijo.dnidorso);
      formData.append(`hijos[${index}].constanciaBoletin`, hijo.constanciaBoletin);
    });

    try {
      const response = await axios.post('./api/formulario', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormId(response.data.formId);
      navigate('/confirmation');
    } catch (error) {
      console.error('Error submitting form:', error.message);
      alert('Error setting up the request.');
    }
  };

  const TALLE_GUARDAPOLVOS = [
    { talle: '6', anchoPecho: 67, largo: 64, anchoEspalda: 33, manga: 43 },
    { talle: '8', anchoPecho: 70, largo: 71, anchoEspalda: 35, manga: 46 },
    { talle: '10', anchoPecho: 74, largo: 80, anchoEspalda: 36, manga: 50 },
    { talle: '12', anchoPecho: 80, largo: 86, anchoEspalda: 38, manga: 55 },
    { talle: '14', anchoPecho: 82, largo: 95, anchoEspalda: 41, manga: 58 },
    { talle: '16', anchoPecho: 90, largo: 102, anchoEspalda: 44, manga: 62 },
    { talle: '18', anchoPecho: 94, largo: 107, anchoEspalda: 45, manga: 66 }
  ];

  return (
    <div className="container">
      {isAuthenticated ? (
        !showPreview ? (
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => (
              <Form>
                <div>
                  <label htmlFor="nombre">Nombre</label>
                  <Field name="nombre" type="text" />
                  <ErrorMessage name="nombre" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="telefono">Teléfono</label>
                  <Field name="telefono" type="text" />
                  <ErrorMessage name="telefono" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <Field name="email" type="email" />
                  <ErrorMessage name="email" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="reciboSueldo">Recibo de Sueldo</label>
                  <input name="reciboSueldo" type="file" onChange={(e) => setFieldValue('reciboSueldo', e.currentTarget.files[0])} />
                  <ErrorMessage name="reciboSueldo" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="dniFrente">DNI Frente</label>
                  <input name="dniFrente" type="file" onChange={(e) => setFieldValue('dniFrente', e.currentTarget.files[0])} />
                  <ErrorMessage name="dniFrente" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="dniDorso">DNI Dorso</label>
                  <input name="dniDorso" type="file" onChange={(e) => setFieldValue('dniDorso', e.currentTarget.files[0])} />
                  <ErrorMessage name="dniDorso" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="carnetSindicalFrente">Carnet Sindical Frente</label>
                  <input name="carnetSindicalFrente" type="file" onChange={(e) => setFieldValue('carnetSindicalFrente', e.currentTarget.files[0])} />
                  <ErrorMessage name="carnetSindicalFrente" component="div" className="error" />
                </div>
                <div>
                  <label htmlFor="carnetSindicalDorso">Carnet Sindical Dorso</label>
                  <input name="carnetSindicalDorso" type="file" onChange={(e) => setFieldValue('carnetSindicalDorso', e.currentTarget.files[0])} />
                  <ErrorMessage name="carnetSindicalDorso" component="div" className="error" />
                </div>
                <FieldArray name="hijos">
                  {({ remove, push }) => (
                    <div>
                      {values.hijos.map((hijo, index) => (
                        <div key={index}>
                          <div>
                            <label htmlFor={`hijos.${index}.apellidoynombre`}>Apellido y Nombre</label>
                            <Field name={`hijos.${index}.apellidoynombre`} type="text" />
                            <ErrorMessage name={`hijos.${index}.apellidoynombre`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.edad`}>Edad</label>
                            <Field name={`hijos.${index}.edad`} type="number" />
                            <ErrorMessage name={`hijos.${index}.edad`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.ciclolectivo`}>Ciclo Lectivo</label>
                            <Field as="select" name={`hijos.${index}.ciclolectivo`}>
                              <option value="">Seleccione</option>
                              <option value="prescolar">Prescolar</option>
                              <option value="primaria 1ro a 3er grado">Primaria 1ro a 3er grado</option>
                              <option value="primaria 4to a 6to grado">Primaria 4to a 6to grado</option>
                              <option value="secundaria">Secundaria</option>
                            </Field>
                            <ErrorMessage name={`hijos.${index}.ciclolectivo`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.escuela`}>Escuela</label>
                            <Field name={`hijos.${index}.escuela`} type="text" />
                            <ErrorMessage name={`hijos.${index}.escuela`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.estatal`}>Estatal</label>
                            <Field name={`hijos.${index}.estatal`} type="checkbox" />
                            <ErrorMessage name={`hijos.${index}.estatal`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.privada`}>Privada</label>
                            <Field name={`hijos.${index}.privada`} type="checkbox" />
                            <ErrorMessage name={`hijos.${index}.privada`} component="div" className="error" />
                          </div>
                          {values.hijos[index].ciclolectivo !== "prescolar" && values.hijos[index].ciclolectivo !== "secundaria" && (
                            values.hijos[index].privada ? (
                              <div>Kit Escolar sin guardapolvo</div>
                            ) : (
                              <div>
                                <label>Talle Guardapolvo</label>
                                <table className="talles-table">
                                  <thead>
                                    <tr>
                                      <th>Talles</th>
                                      <th>Ancho Pecho (contorno total)</th>
                                      <th>Largo</th>
                                      <th>Ancho Espalda</th>
                                      <th>Manga</th>
                                      <th>Seleccionar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {TALLE_GUARDAPOLVOS.map((talle) => (
                                      <tr key={talle.talle}>
                                        <td>{talle.talle}</td>
                                        <td>{talle.anchoPecho}</td>
                                        <td>{talle.largo}</td>
                                        <td>{talle.anchoEspalda}</td>
                                        <td>{talle.manga}</td>
                                        <td>
                                          <Field type="radio" name={`hijos.${index}.talleguardapolvo`} value={talle.talle} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <ErrorMessage name={`hijos.${index}.talleguardapolvo`} component="div" className="error" />
                              </div>
                            )
                          )}
                          <div>
                            <label htmlFor={`hijos.${index}.dnifrente`}>DNI Frente</label>
                            <input name={`hijos.${index}.dnifrente`} type="file" onChange={(e) => setFieldValue(`hijos.${index}.dnifrente`, e.currentTarget.files[0])} />
                            <ErrorMessage name={`hijos.${index}.dnifrente`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.dnidorso`}>DNI Dorso</label>
                            <input name={`hijos.${index}.dnidorso`} type="file" onChange={(e) => setFieldValue(`hijos.${index}.dnidorso`, e.currentTarget.files[0])} />
                            <ErrorMessage name={`hijos.${index}.dnidorso`} component="div" className="error" />
                          </div>
                          <div>
                            <label htmlFor={`hijos.${index}.constanciaBoletin`}>Constancia de Alumno Regular o Boletín</label>
                            <input name={`hijos.${index}.constanciaBoletin`} type="file" onChange={(e) => setFieldValue(`hijos.${index}.constanciaBoletin`, e.currentTarget.files[0])} />
                            <ErrorMessage name={`hijos.${index}.constanciaBoletin`} component="div" className="error" />
                          </div>
                          <button type="button" onClick={() => remove(index)}>Quitar Hijo</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => push({
                        apellidoynombre: '', edad: '', ciclolectivo: '', escuela: '', estatal: false, privada: false,
                        talleguardapolvo: '', dnifrente: null, dnidorso: null, constanciaBoletin: null
                      })}>
                        Agregar Hijo
                      </button>
                    </div>
                  )}
                </FieldArray>
                <button type="button" onClick={() => handlePreview(values)}>Previsualizar Correo</button>
                <button type="submit">Enviar formulario</button>
              </Form>
            )}
          </Formik>
        ) : (
          <div className="preview-email animated-preview">
            <h2>Previsualización del Correo</h2>
            <div dangerouslySetInnerHTML={{ __html: previewEmail }} />
            <button onClick={() => setShowPreview(false)}>Volver al Formulario</button>
            <button onClick={() => handleSubmit(previewValues)}>Enviar formulario</button>

          </div>
        )
      ) : (
        <p>Por favor, inicia sesión para acceder a esta página.</p>
      )}
    </div>
  );
};

export default ProtectedPage;
