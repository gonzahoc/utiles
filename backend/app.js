
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const multer = require('multer');
const path = require('path');


const fs = require('fs');

const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();



const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, '../build')));



app.use(express.json());

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: '190.228.29.65',
  user: 'martuns',
  password: 'q7AlNMg54lH7',
  database: 'stipa_osipa_bd_2019'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.correoseguro.co',
  port: 587,
  secure: false,
  auth: {
    user: 'entregadeutiles@stipa.org.ar',
    pass: '0I53ajl1g9D1'
  }
});

// Función para enviar correo electrónico de confirmación
const sendConfirmationEmail = (email, token) => {
  const mailOptions = {
    from: 'entregadeutiles@stipa.org.ar',
    to: email,
    subject: 'Confirmación de correo electrónico',
    text: `Por favor, haz clic en el siguiente enlace para confirmar tu correo electrónico: http://utiles.stipa.org.ar/api/confirm?token=${token}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending confirmation email:', err);
    } else {
      console.log('Confirmation email sent:', info.response);
    }
  });
};

// upload de archivos
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar el tamaño del archivo a 5MB
}));

// Ruta para subir archivos
app.post('/api/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No se subió ningún archivo.');
  }
  const file = req.files.file; // El nombre del campo debe coincidir con el input de frontend

  // Mover el archivo a la carpeta 'tmp'
  file.mv(`./tmp/${file.name}`, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    res.send('Archivo subido exitosamente');
  });
});






// Lógica para generar un token de confirmación único
const generateToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Ruta para registrar un nuevo usuario
app.post('/api/register', (req, res) => {
  const { nombre, cuil, empresa, nrosindical, pass, mail } = req.body;
  const token = generateToken();

  const checkQuery = 'SELECT * FROM sisteUtiles WHERE mail = ? OR nrosindical = ?';
  db.query(checkQuery, [mail, nrosindical], (err, results) => {
    if (err) {
      console.error('Error checking for existing user:', err);
      return res.status(500).json({ error: 'Error checking for existing user' });
    }

    if (results.length > 0) {
      console.log('Email or nrosindical already registered');
      return res.status(409).json({ error: 'Email or Número Sindical already registered.' });
    }

    const sql = 'INSERT INTO sisteUtiles SET ?';
    const values = { nombre, cuil, empresa, nrosindical, pass, mail, confirmed: false, confirmation_token: token };

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.status(500).json({ error: 'Error registering user' });
      }

      console.log('User registered:', mail);
      sendConfirmationEmail(mail, token);
      res.status(200).json({ message: 'Usuario registrado con exito, chequea tu correo para confirmar el perfil' });
      

    });
  });
});

// Ruta para confirmar el correo electrónico
/* app.get('/api/confirm', (req, res) => {
  const { token } = req.query;

  const sql = 'UPDATE sisteUtiles SET confirmed = true WHERE confirmation_token = ?';
  db.query(sql, [token], (err, result) => {
    if (err) {
      console.error('Error confirmando email:', err);
      return res.status(500).json({ error: 'Error confirmando email' });
    }

    if (result.affectedRows === 0) {
      console.error('Invalid token:', token);
      return res.status(400).json({ error: 'Token invalido ' });
    }

    

    console.log('Email confirmed:', token);
    // Redirigir al usuario a la página principal una vez confirmada su cuenta
    res.redirect('https://utiles.stipa.org.ar');
  });
}); */

// Ruta para confirmar el correo electrónico
app.get('/api/confirm', (req, res) => {
  const { token } = req.query;

  const sql = 'UPDATE sisteUtiles SET confirmed = true WHERE confirmation_token = ?';
  db.query(sql, [token], (err, result) => {
    if (err) {
      console.error('Error confirmando email:', err);
      // Redirige a una página de error si hay un error en la base de datos
      return res.redirect('https://utiles.stipa.org.ar/error');
    }

    if (result.affectedRows === 0) {
      console.error('Invalid token:', token);
      // Redirige a una página de error si el token es inválido
      return res.redirect('https://utiles.stipa.org.ar/error');
    }

    console.log('Email confirmed:', token);
    // Redirige a la página principal una vez que la confirmación es exitosa
    return res.redirect('https://utiles.stipa.org.ar');
  });
});


app.get('/api/pepe', (req, res) => {
  const { token } = req.query;

    res.status(200).json({ message: 'Daleeeee' });
});

// Lógica para limpiar los registros de usuarios no confirmados después de un cierto tiempo
const cleanupUnconfirmedUsers = () => {
  const sql = 'DELETE FROM sisteUtiles WHERE confirmed = false AND created_at < NOW() - INTERVAL 10 MINUTE';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error cleaning up unconfirmed users:', err);
    } else {
      console.log('Cleaned up unconfirmed users:', result.affectedRows);
    }
  });
};

// Programa un trabajo cron para limpiar los registros de usuarios no confirmados regularmente
setInterval(cleanupUnconfirmedUsers, 10 * 60 * 1000); // Limpia cada 10 minutos

// Ruta para el inicio de sesión
app.post('/api/login', (req, res) => {
  //fs.writeFileSync('./tmp/logslogin.txt', 'LOG de logueo:'+req.body.mail, { flag: 'a+' }, err => {});

  const { mail, pass } = req.body;
  console.log('Login request received:', { mail, pass });

  const sql = 'SELECT * FROM sisteUtiles WHERE mail = ? AND pass = ? AND confirmed = true';
  db.query(sql, [mail, pass], (err, results) => {
    if (err) {
      console.error('Error querying user:', err);
      return res.status(500).json({ error: 'Error logging in user' });
    }

    if (results.length === 0) {
      console.log('No user found or email not confirmed');
      return res.status(401).json({ error: 'Invalid email or password, or email not confirmed' });
    }

    console.log('Login successful for user:', mail);
    res.status(200).json({ message: 'Login successful', user: results[0] });
  });
});

// Configuración de Multer para manejar la subida de archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'tmp/');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limita los archivos a 5MB
  fileFilter: (req, file, cb) => {
    const fieldNameRegex = /^(reciboSueldo|dniFrente|dniDorso|carnetSindicalFrente|carnetSindicalDorso|hijos\[\d+\]\.(dnifrente|dnidorso|constanciaBoletin))$/;
    if (fieldNameRegex.test(file.fieldname)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  }
});



///////////////////////////////// punto 1

// Ruta para manejar la recepción de datos y archivos del formulario
// Ruta para manejar la recepción de datos y archivos del formulario
app.post('/api/formulario', async (req, res) => {
  try {
    console.log('Form data:', req.body);
    console.log('Files:', req.files);

    const { nombre, telefono, mail } = req.body;

    // Verificación de datos básicos del usuario
    if (!nombre || !telefono || !mail) {
      console.log('Faltan datos del usuario');
      return res.status(400).json({ error: 'Faltan datos del usuario' });
    }

    // Procesamiento de datos de hijos
    const hijos = [];
    for (let i = 0; req.body[`hijos[${i}].apellidoynombre`]; i++) {
      hijos.push({
        apellidoynombre: req.body[`hijos[${i}].apellidoynombre`],
        edad: req.body[`hijos[${i}].edad`],
        ciclolectivo: req.body[`hijos[${i}].ciclolectivo`],
        escuela: req.body[`hijos[${i}].escuela`],
        estatal: req.body[`hijos[${i}].estatal`],
        privada: req.body[`hijos[${i}].privada`],
        talleguardapolvo: req.body[`hijos[${i}].talleguardapolvo`],
        dnifrente: req.files[`hijos[${i}].dnifrente`] ? req.files[`hijos[${i}].dnifrente`].name : null,
        dnidorso: req.files[`hijos[${i}].dnidorso`] ? req.files[`hijos[${i}].dnidorso`].name : null,
        constanciaBoletin: req.files[`hijos[${i}].constanciaBoletin`] ? req.files[`hijos[${i}].constanciaBoletin`].name : null
      });
    }

    console.log('Procesados hijos:', hijos);

    // Generar un nombre de archivo único
    const generateUniqueFilename = (originalName) => {
      const timestamp = Date.now();
      const ext = path.extname(originalName);  // Obtener la extensión del archivo
      const baseName = path.basename(originalName, ext);  // Obtener el nombre sin la extensión
      return `${baseName}-${timestamp}${ext}`;
    };

    // Almacenar archivos en la carpeta 'tmp'
    const saveFiles = (file, fieldName) => {
      const uniqueFileName = generateUniqueFilename(file.name);  // Generar nombre único
      const uploadPath = path.join(__dirname, 'tmp', uniqueFileName);
      console.log(`Guardando archivo ${file.name} como ${uniqueFileName}`);
      return new Promise((resolve, reject) => {
        file.mv(uploadPath, (err) => {
          if (err) {
            console.error('Error moviendo el archivo:', err);
            reject(err);
          } else {
            resolve(uniqueFileName);  // Devolver el nombre del archivo guardado
          }
        });
      });
    };

    // Procesar archivos del usuario
    const filesToSave = [
      req.files.reciboSueldo && saveFiles(req.files.reciboSueldo, 'reciboSueldo'),
      req.files.dniFrente && saveFiles(req.files.dniFrente, 'dniFrente'),
      req.files.dniDorso && saveFiles(req.files.dniDorso, 'dniDorso'),
      req.files.carnetSindicalFrente && saveFiles(req.files.carnetSindicalFrente, 'carnetSindicalFrente'),
      req.files.carnetSindicalDorso && saveFiles(req.files.carnetSindicalDorso, 'carnetSindicalDorso'),
      ...hijos.flatMap((hijo, index) => [
        hijo.dnifrente && saveFiles(req.files[`hijos[${index}].dnifrente`], `hijos_${index}_dnifrente`),
        hijo.dnidorso && saveFiles(req.files[`hijos[${index}].dnidorso`], `hijos_${index}_dnidorso`),
        hijo.constanciaBoletin && saveFiles(req.files[`hijos[${index}].constanciaBoletin`], `hijos_${index}_constanciaBoletin`)
      ])
    ].filter(Boolean);

    console.log('Archivos a guardar:', filesToSave);

    // Guardar todos los archivos en el sistema
    const savedFiles = await Promise.all(filesToSave);

    console.log('Archivos guardados:', savedFiles);

    // Preparar el correo electrónico
    const mailOptions = {
      from: 'entregadeutiles@stipa.org.ar',
      to: 'hocgonzalo@gmail.com',
      cc: mail,
      subject: 'Formulario de Datos',
      html: `
        <h2>Información del Usuario</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Email:</strong> ${mail}</p>

        <h3>Información de los Hijos</h3>
        ${hijos.map((hijo, index) => `
          <h4>Hijo ${index + 1}</h4>
          <p><strong>Apellido y Nombre:</strong> ${hijo.apellidoynombre}</p>
          <p><strong>Edad:</strong> ${hijo.edad}</p>
          <p><strong>Ciclo Lectivo:</strong> ${hijo.ciclolectivo}</p>
          <p><strong>Escuela:</strong> ${hijo.escuela}</p>
          <p><strong>Estatal:</strong> ${hijo.estatal ? 'Sí' : 'No'}</p>
          <p><strong>Privada:</strong> ${hijo.privada ? 'Sí' : 'No'}</p>
          <p><strong>Talle Guardapolvo:</strong> ${hijo.talleguardapolvo || 'No aplica'}</p>
        `).join('')}
        `
    };
      
    

    console.log('Enviando correo electrónico con datos adjuntos...');
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ error: 'Error al enviar el correo' });
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Formulario enviado correctamente y correo electrónico enviado exitosamente.' });
    });

  } catch (err) {
    console.error('Error processing form:', err);
    res.status(500).json({ error: 'Error al procesar el formulario' });
  }
});


///////////////////////////////// punto 2
// Ruta para manejar la recepción y almacenamiento de datos del formulario

//try{
    // app.post('/api/formulario',  upload.any(), (req, res) => {
    // try {
    //   fs.writeFileSync('./tmp/logs.txt', 'Formulario started:'+JSON.stringify(req.body), { flag: 'a+' }, err => {});
    //   console.log('Form data:', req.body);
    //   console.log('Files:', req.files);
  
    //   const { nombre, telefono, mail } = req.body;
    //   //esto (?)
    //   //return res.status(200).json({ message: req.body });
    //   // esto (?)
    //   // Obtener datos de los hijos
    //   const hijos = [];
    //   for (let i = 0; req.body[`hijos[${i}].apellidoynombre`]; i++) {
    //     hijos.push({
    //       apellidoynombre: req.body[`hijos[${i}].apellidoynombre`],
    //       edad: req.body[`hijos[${i}].edad`],
    //       ciclolectivo: req.body[`hijos[${i}].ciclolectivo`],
    //       escuela: req.body[`hijos[${i}].escuela`],
    //       estatal: req.body[`hijos[${i}].estatal`],
    //       privada: req.body[`hijos[${i}].privada`],
    //       talleguardapolvo: req.body[`hijos[${i}].talleguardapolvo`],
    //       dnifrente: req.files.find(file => file.fieldname === `hijos[${i}].dnifrente`) ? req.files.find(file => file.fieldname === `hijos[${i}].dnifrente`).filename : null,
    //       dnidorso: req.files.find(file => file.fieldname === `hijos[${i}].dnidorso`) ? req.files.find(file => file.fieldname === `hijos[${i}].dnidorso`).filename : null,
    //       constanciaBoletin: req.files.find(file => file.fieldname === `hijos[${i}].constanciaBoletin`) ? req.files.find(file => file.fieldname === `hijos[${i}].constanciaBoletin`).filename : null
    //     });
    //   }
  
    //   const userValues = {
    //     nombre,
    //     telefono,
    //     reciboSueldo: req.files.find(file => file.fieldname === 'reciboSueldo') ? req.files.find(file => file.fieldname === 'reciboSueldo').filename : null,
    //     dniFrente: req.files.find(file => file.fieldname === 'dniFrente') ? req.files.find(file => file.fieldname === 'dniFrente').filename : null,
    //     dniDorso: req.files.find(file => file.fieldname === 'dniDorso') ? req.files.find(file => file.fieldname === 'dniDorso').filename : null,
    //     carnetSindicalFrente: req.files.find(file => file.fieldname === 'carnetSindicalFrente') ? req.files.find(file => file.fieldname === 'carnetSindicalFrente').filename : null,
    //     carnetSindicalDorso: req.files.find(file => file.fieldname === 'carnetSindicalDorso') ? req.files.find(file => file.fieldname === 'carnetSindicalDorso').filename : null
    //   };
  
    //   const attachments = [
    //     userValues.reciboSueldo && { filename: userValues.reciboSueldo, path: path.resolve(__dirname, 'tmp', userValues.reciboSueldo) },
    //     userValues.dniFrente && { filename: userValues.dniFrente, path: path.resolve(__dirname, 'tmp', userValues.dniFrente) },
    //     userValues.dniDorso && { filename: userValues.dniDorso, path: path.resolve(__dirname, 'tmp', userValues.dniDorso) },
    //     userValues.carnetSindicalFrente && { filename: userValues.carnetSindicalFrente, path: path.resolve(__dirname, 'tmp', userValues.carnetSindicalFrente) },
    //     userValues.carnetSindicalDorso && { filename: userValues.carnetSindicalDorso, path: path.resolve(__dirname, 'tmp', userValues.carnetSindicalDorso) },
    //     ...hijos.flatMap((hijo, index) => [
    //       hijo.dnifrente && { filename: hijo.dnifrente, path: path.resolve(__dirname, 'tmp', hijo.dnifrente) },
    //       hijo.dnidorso && { filename: hijo.dnidorso, path: path.resolve(__dirname, 'tmp', hijo.dnidorso) },
    //       hijo.constanciaBoletin && { filename: hijo.constanciaBoletin, path: path.resolve(__dirname, 'tmp', hijo.constanciaBoletin) }
    //     ]).filter(Boolean)
    //   ];
  
    //   // Prepara el correo electrónico
    //   const mailOptions = {
    //     from: 'entregadeutiles@stipa.org.ar',
    //     to: 'hocgonzalo@gmail.com',
    //     cc: mail,
    //     subject: 'Formulario de Datos',
    //     html: `
    //       <h2>Información del Usuario</h2>
    //       <p><strong>Nombre:</strong> ${nombre}</p>
    //       <p><strong>Teléfono:</strong> ${telefono}</p>
    //       <p><strong>Email:</strong> ${mail}</p>
  
    //       <h3>Archivos Adjuntos del Usuario</h3>
    //       <ul>
    //         <li><strong>Recibo de Sueldo:</strong> ${userValues.reciboSueldo ? `<a href="cid:reciboSueldo">Descargar</a>` : 'No adjunto'}</li>
    //         <li><strong>DNI Frente:</strong> ${userValues.dniFrente ? `<a href="cid:dniFrente">Descargar</a>` : 'No adjunto'}</li>
    //         <li><strong>DNI Dorso:</strong> ${userValues.dniDorso ? `<a href="cid:dniDorso">Descargar</a>` : 'No adjunto'}</li>
    //         <li><strong>Carnet Sindical Frente:</strong> ${userValues.carnetSindicalFrente ? `<a href="cid:carnetSindicalFrente">Descargar</a>` : 'No adjunto'}</li>
    //         <li><strong>Carnet Sindical Dorso:</strong> ${userValues.carnetSindicalDorso ? `<a href="cid:carnetSindicalDorso">Descargar</a>` : 'No adjunto'}</li>
    //       </ul>
  
    //       <h3>Información de los Hijos</h3>
    //       ${hijos.map((hijo, index) => `
    //         <h4>Hijo ${index + 1}</h4>
    //         <p><strong>Apellido y Nombre:</strong> ${hijo.apellidoynombre}</p>
    //         <p><strong>Edad:</strong> ${hijo.edad}</p>
    //         <p><strong>Ciclo Lectivo:</strong> ${hijo.ciclolectivo}</p>
    //         <p><strong>Escuela:</strong> ${hijo.escuela}</p>
    //         <p><strong>Estatal:</strong> ${hijo.estatal ? 'Sí' : 'No'}</p>
    //         <p><strong>Privada:</strong> ${hijo.privada ? 'Sí' : 'No'}</p>
    //         <p><strong>Talle Guardapolvo:</strong> ${hijo.talleguardapolvo || 'No aplica'}</p>
  
    //         <h4>Archivos Adjuntos del Hijo ${index + 1}</h4>
    //         <ul>
    //           <li><strong>DNI Frente:</strong> ${hijo.dnifrente ? `<a href="cid:dnifrente_${index}">Descargar</a>` : 'No adjunto'}</li>
    //           <li><strong>DNI Dorso:</strong> ${hijo.dnidorso ? `<a href="cid:dnidorso_${index}">Descargar</a>` : 'No adjunto'}</li>
    //           <li><strong>Constancia de Alumno Regular o Boletín:</strong> ${hijo.constanciaBoletin ? `<a href="cid:constanciaBoletin_${index}">Descargar</a>` : 'No adjunto'}</li>
    //         </ul>
    //       `).join('')}
    //     `,
    //     attachments
    //   };
    //   //return res.status(200).json({ message: 'User updated and email sent successfully' });
    //   fs.writeFileSync('./tmp/logs.txt', 'Formulario pre send mail:', { flag: 'a+' }, err => {});
    //   // Envía el correo electrónico
    //   transporter.sendMail(mailOptions, (err, info) => {
    //     if (err) {
    //       console.error('Error sending email:', err);  // Muestra más detalles sobre el error
    //       //fs.writeFileSync('./tmp/logs.txt', 'Formulario error sending mail:'+JSON.stringify(err), { flag: 'a+' }, err => {});
    //       return res.status(500).json({ error: 'Failed to send email' });
    //     }
    //     console.log('Email sent:', info.response);
    //     res.status(200).json({ message: 'Formulario enviado y correo electrónico enviado exitosamente' });
    //   });
      
    // } catch (err) {
    //   //fs.writeFileSync('./tmp/logs.txt', 'Error processing form data:'+JSON.stringify(err), { flag: 'a+' }, err => {});
    //   console.error('Error processing form data:', err);
    //   console.error('Error processing form data:', JSON.stringify(err, null, 2));

    //   //res.status(500).json({ error: 'Failed to process form data' });
    // }
    // res.status(200).json({ message: 'Formulario procesado correctamente' });
    // });

  
    
   
    
    // app.post('/api/formulario', upload.any(), (req, res) => {
    //   try {
    //     writeLog(`Formulario started: ${JSON.stringify(req.body)}`);
    //     console.log('Form data:', req.body);
    //     console.log('Files:', req.files);
    
    //     const { nombre, telefono, mail } = req.body;
    
    //     const hijos = [];
    //     for (let i = 0; req.body[`hijos[${i}].apellidoynombre`]; i++) {
    //       hijos.push({
    //         apellidoynombre: req.body[`hijos[${i}].apellidoynombre`],
    //         edad: req.body[`hijos[${i}].edad`],
    //         ciclolectivo: req.body[`hijos[${i}].ciclolectivo`],
    //         escuela: req.body[`hijos[${i}].escuela`],
    //         estatal: req.body[`hijos[${i}].estatal`],
    //         privada: req.body[`hijos[${i}].privada`],
    //         talleguardapolvo: req.body[`hijos[${i}].talleguardapolvo`],
    //         dnifrente: req.files.find(file => file.fieldname === `hijos[${i}].dnifrente`) ? req.files.find(file => file.fieldname === `hijos[${i}].dnifrente`).filename : null,
    //         dnidorso: req.files.find(file => file.fieldname === `hijos[${i}].dnidorso`) ? req.files.find(file => file.fieldname === `hijos[${i}].dnidorso`).filename : null,
    //         constanciaBoletin: req.files.find(file => file.fieldname === `hijos[${i}].constanciaBoletin`) ? req.files.find(file => file.fieldname === `hijos[${i}].constanciaBoletin`).filename : null
    //       });
    //     }
    
    //     const userValues = {
    //       nombre,
    //       telefono,
    //       reciboSueldo: req.files.find(file => file.fieldname === 'reciboSueldo') ? req.files.find(file => file.fieldname === 'reciboSueldo').filename : null,
    //       dniFrente: req.files.find(file => file.fieldname === 'dniFrente') ? req.files.find(file => file.fieldname === 'dniFrente').filename : null,
    //       dniDorso: req.files.find(file => file.fieldname === 'dniDorso') ? req.files.find(file => file.fieldname === 'dniDorso').filename : null,
    //       carnetSindicalFrente: req.files.find(file => file.fieldname === 'carnetSindicalFrente') ? req.files.find(file => file.fieldname === 'carnetSindicalFrente').filename : null,
    //       carnetSindicalDorso: req.files.find(file => file.fieldname === 'carnetSindicalDorso') ? req.files.find(file => file.fieldname === 'carnetSindicalDorso').filename : null
    //     };
    
    //     const attachments = [
    //       userValues.reciboSueldo && { filename: userValues.reciboSueldo, path: path.resolve(logDirectory, userValues.reciboSueldo) },
    //       userValues.dniFrente && { filename: userValues.dniFrente, path: path.resolve(logDirectory, userValues.dniFrente) },
    //       userValues.dniDorso && { filename: userValues.dniDorso, path: path.resolve(logDirectory, userValues.dniDorso) },
    //       userValues.carnetSindicalFrente && { filename: userValues.carnetSindicalFrente, path: path.resolve(logDirectory, userValues.carnetSindicalFrente) },
    //       userValues.carnetSindicalDorso && { filename: userValues.carnetSindicalDorso, path: path.resolve(logDirectory, userValues.carnetSindicalDorso) },
    //       ...hijos.flatMap((hijo, index) => [
    //         hijo.dnifrente && { filename: hijo.dnifrente, path: path.resolve(logDirectory, hijo.dnifrente) },
    //         hijo.dnidorso && { filename: hijo.dnidorso, path: path.resolve(logDirectory, hijo.dnidorso) },
    //         hijo.constanciaBoletin && { filename: hijo.constanciaBoletin, path: path.resolve(logDirectory, hijo.constanciaBoletin) }
    //       ]).filter(Boolean)
    //     ];
    
    //     // Prepara el correo electrónico
    //     const mailOptions = {
    //       from: 'entregadeutiles@stipa.org.ar',
    //       to: 'hocgonzalo@gmail.com',
    //       cc: mail,
    //       subject: 'Formulario de Datos',
    //       html: `
    //         <h2>Información del Usuario</h2>
    //         <p><strong>Nombre:</strong> ${nombre}</p>
    //         <p><strong>Teléfono:</strong> ${telefono}</p>
    //         <p><strong>Email:</strong> ${mail}</p>
    //         <h3>Archivos Adjuntos del Usuario</h3>
    //         <ul>
    //           <li><strong>Recibo de Sueldo:</strong> ${userValues.reciboSueldo ? `<a href="cid:reciboSueldo">Descargar</a>` : 'No adjunto'}</li>
    //           <li><strong>DNI Frente:</strong> ${userValues.dniFrente ? `<a href="cid:dniFrente">Descargar</a>` : 'No adjunto'}</li>
    //           <li><strong>DNI Dorso:</strong> ${userValues.dniDorso ? `<a href="cid:dniDorso">Descargar</a>` : 'No adjunto'}</li>
    //           <li><strong>Carnet Sindical Frente:</strong> ${userValues.carnetSindicalFrente ? `<a href="cid:carnetSindicalFrente">Descargar</a>` : 'No adjunto'}</li>
    //           <li><strong>Carnet Sindical Dorso:</strong> ${userValues.carnetSindicalDorso ? `<a href="cid:carnetSindicalDorso">Descargar</a>` : 'No adjunto'}</li>
    //         </ul>
    //         <h3>Información de los Hijos</h3>
    //         ${hijos.map((hijo, index) => `
    //           <h4>Hijo ${index + 1}</h4>
    //           <p><strong>Apellido y Nombre:</strong> ${hijo.apellidoynombre}</p>
    //           <p><strong>Edad:</strong> ${hijo.edad}</p>
    //           <p><strong>Ciclo Lectivo:</strong> ${hijo.ciclolectivo}</p>
    //           <p><strong>Escuela:</strong> ${hijo.escuela}</p>
    //           <p><strong>Estatal:</strong> ${hijo.estatal ? 'Sí' : 'No'}</p>
    //           <p><strong>Privada:</strong> ${hijo.privada ? 'Sí' : 'No'}</p>
    //           <p><strong>Talle Guardapolvo:</strong> ${hijo.talleguardapolvo || 'No aplica'}</p>
    //           <h4>Archivos Adjuntos del Hijo ${index + 1}</h4>
    //           <ul>
    //             <li><strong>DNI Frente:</strong> ${hijo.dnifrente ? `<a href="cid:dnifrente_${index}">Descargar</a>` : 'No adjunto'}</li>
    //             <li><strong>DNI Dorso:</strong> ${hijo.dnidorso ? `<a href="cid:dnidorso_${index}">Descargar</a>` : 'No adjunto'}</li>
    //             <li><strong>Constancia de Alumno Regular o Boletín:</strong> ${hijo.constanciaBoletin ? `<a href="cid:constanciaBoletin_${index}">Descargar</a>` : 'No adjunto'}</li>
    //           </ul>
    //         `).join('')}
    //       `,
    //       attachments
    //     };
    
    //     transporter.sendMail(mailOptions, (err, info) => {
    //       if (err) {
    //         writeLog(`Error sending email: ${JSON.stringify(err)}`);
    //         console.error('Error sending email:', err);
    //         return res.status(500).json({ error: 'Failed to send email' });
    //       }
    //       writeLog(`Email sent: ${info.response}`);
    //       console.log('Email sent:', info.response);
    //       return res.status(200).json({ message: 'Formulario enviado y correo electrónico enviado exitosamente' });
    //     });
        
    //   } catch (err) {
    //     writeLog(`Error processing form data: ${JSON.stringify(err, null, 2)}`);
    //     console.error('Error processing form data:', err);
    //     return res.status(500).json({ error: 'Failed to process form data' });
    //   }
    // });
    
    

    //esto de aca funciona pero es limitado solo estan los datos de hijos en el mail 
    // app.post('/api/formulario', (req, res) => {
    //   try {
    //     console.log('Formulario started:', req.body);
    
    //     const { nombre, telefono, mail } = req.body;
    
    //     const hijos = [];
    //     for (let i = 0; req.body[`hijos[${i}].apellidoynombre`]; i++) {
    //       hijos.push({
    //         apellidoynombre: req.body[`hijos[${i}].apellidoynombre`],
    //         edad: req.body[`hijos[${i}].edad`],
    //         ciclolectivo: req.body[`hijos[${i}].ciclolectivo`],
    //         escuela: req.body[`hijos[${i}].escuela`],
    //         estatal: req.body[`hijos[${i}].estatal`],
    //         privada: req.body[`hijos[${i}].privada`],
    //         talleguardapolvo: req.body[`hijos[${i}].talleguardapolvo`]
    //       });
    //     }
    
    //     // Prepara el correo electrónico
    //     const mailOptions = {
    //       from: 'entregadeutiles@stipa.org.ar',
    //       to: 'hocgonzalo@gmail.com',
    //       cc: mail,
    //       subject: 'Formulario de Datos',
    //       html: `
    //         <h2>Información del Usuario</h2>
    //         <p><strong>Nombre:</strong> ${nombre}</p>
    //         <p><strong>Teléfono:</strong> ${telefono}</p>
    //         <p><strong>Email:</strong> ${mail}</p>
    //         <h3>Información de los Hijos</h3>
    //         ${hijos.map((hijo, index) => `
    //           <h4>Hijo ${index + 1}</h4>
    //           <p><strong>Apellido y Nombre:</strong> ${hijo.apellidoynombre}</p>
    //           <p><strong>Edad:</strong> ${hijo.edad}</p>
    //           <p><strong>Ciclo Lectivo:</strong> ${hijo.ciclolectivo}</p>
    //           <p><strong>Escuela:</strong> ${hijo.escuela}</p>
    //           <p><strong>Estatal:</strong> ${hijo.estatal ? 'Sí' : 'No'}</p>
    //           <p><strong>Privada:</strong> ${hijo.privada ? 'Sí' : 'No'}</p>
    //           <p><strong>Talle Guardapolvo:</strong> ${hijo.talleguardapolvo || 'No aplica'}</p>
    //         `).join('')}
    //       `
    //     };
    
    //     transporter.sendMail(mailOptions, (err, info) => {
    //       if (err) {
    //         console.error('Error sending email:', err);
    //         return res.status(500).json({ error: 'Failed to send email' });
    //       }
    //       console.log('Email sent:', info.response);
    //       return res.status(200).json({ message: 'Formulario enviado correctamente' });
    //     });
    
    //   } catch (err) {
    //     console.error('Error processing form data:', err);
    //     return res.status(500).json({ error: 'Error procesando el formulario' });
    //   }
    // });
    


app.use(express.static(path.join(__dirname, './public')));
// Ruta para manejar las demás solicitudes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../utiles/build', 'index.html'));
});


// Iniciar el servidor en el puerto 3001
app.listen(port, () => {
  console.log('Server running on ');
});