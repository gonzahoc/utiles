const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
// const morgan = require('morgan');
// const fs = require('fs');
// const {allowedOrigin,corsOptions} = require('./constants');

// Crear un stream (escribir en un archivo)
// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// app.use(morgan('combined', { stream: accessLogStream }));
// Configuración de CORS

const allowedOrigin = 'https://stipa.org.ar';
const corsOptions= {
    origin:allowedOrigin, // Permitir ambos dominios
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
  };

app.use(cors(corsOptions));
// Asegúrate de que esta línea esté después de tu configuración de CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin); // Establecer el origen permitido
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.options('*', cors());

app.use(express.json());

// Endpoint de prueba para verificar CORS
app.get('/api/cors-test', (req, res) => {
  res.send('CORS is working!');
});

// Verifica que la API esté en funcionamiento
app.get('/api', (req, res) => {
  res.send('API is running');
});

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
    text: `Por favor, haz clic en el siguiente enlace para confirmar tu correo electrónico: http://localhost:3001/api/confirm?token=${token}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending confirmation email:', err);
    } else {
      console.log('Confirmation email sent:', info.response);
    }
  });
};

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
      res.status(200).json({ message: 'User registered. Please check your email to confirm your registration.' });
    });
  });
});

// Ruta para confirmar el correo electrónico
app.get('/api/confirm', (req, res) => {
  const { token } = req.query;

  const sql = 'UPDATE sisteUtiles SET confirmed = true WHERE confirmation_token = ?';
  db.query(sql, [token], (err, result) => {
    if (err) {
      console.error('Error confirming email:', err);
      return res.status(500).json({ error: 'Error confirming email' });
    }

    if (result.affectedRows === 0) {
      console.error('Invalid token:', token);
      return res.status(400).json({ error: 'Invalid token' });
    }

    console.log('Email confirmed:', token);
    res.status(200).json({ message: 'Email confirmed successfully' });
  });
});

// Ruta para el inicio de sesión
app.post('/api/login', (req, res) => {
  // const allowedOrigins = ['https://stipa.org.ar', 'https://www.stipa.org.ar'];
  // const origin = req.headers.origin;
  // return res.status(200).json({ error: 'Error logging in user' });
  // // // Verifica si el origen de la solicitud está en la lista de orígenes permitidos
  // if (allowedOrigin==origin) {
  //   res.setHeader('Access-Control-Allow-Origin', origin); // Establecer el origen permitido
  // }

  const { mail, pass } = req.body;
  console.log('Login request received:', { mail, pass }); // Log para ver la solicitud

  const sql = 'SELECT * FROM sisteUtiles WHERE mail = ? AND pass = ? AND confirmed = true';
  db.query(sql, [mail, pass], (err, results) => {
    if (err) {
      console.error('Error querying user:', err);
      // Asegúrate de enviar las cabeceras CORS incluso en caso de error
      // res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      return res.status(500).json({ error: 'Error logging in user', message:err });
    }

    // Verifica si hay resultados
    if (results.length === 0) {
      // res.setHeader('Access-Control-Allow-Origin', allowedOrigin); // Permitir el origen
      return res.status(401).json({ error: 'Invalid email or password, or email not confirmed' });
    }

    const token = jwt.sign({ id: results[0].id }, 'tu_secreto', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token, user: results[0] });
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
  fileFilter: (req, file, cb) => {
    const fieldNameRegex = /^(reciboSueldo|dniFrente|dniDorso|carnetSindicalFrente|carnetSindicalDorso|hijos\[\d+\]\.(dnifrente|dnidorso|constanciaBoletin))$/;
    if (fieldNameRegex.test(file.fieldname)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  }
});

// Ruta para manejar la recepción y almacenamiento de datos del formulario
app.post('/api/formulario', upload.any(), (req, res) => {
  try {
    console.log('Form data:', req.body);
    console.log('Files:', req.files);

    const { nombre, telefono, mail } = req.body;

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
        dnifrente: req.files.find(file => file.fieldname === `hijos[${i}].dnifrente`) ? req.files.find(file => file.fieldname === `hijos[${i}].dnifrente`).filename : null,
        dnidorso: req.files.find(file => file.fieldname === `hijos[${i}].dnidorso`) ? req.files.find(file => file.fieldname === `hijos[${i}].dnidorso`).filename : null,
        constanciaBoletin: req.files.find(file => file.fieldname === `hijos[${i}].constanciaBoletin`) ? req.files.find(file => file.fieldname === `hijos[${i}].constanciaBoletin`).filename : null
      });
    }

    const userValues = {
      nombre,
      telefono,
      reciboSueldo: req.files.find(file => file.fieldname === 'reciboSueldo') ? req.files.find(file => file.fieldname === 'reciboSueldo').filename : null,
      dniFrente: req.files.find(file => file.fieldname === 'dniFrente') ? req.files.find(file => file.fieldname === 'dniFrente').filename : null,
      dniDorso: req.files.find(file => file.fieldname === 'dniDorso') ? req.files.find(file => file.fieldname === 'dniDorso').filename : null,
      carnetSindicalFrente: req.files.find(file => file.fieldname === 'carnetSindicalFrente') ? req.files.find(file => file.fieldname === 'carnetSindicalFrente').filename : null,
      carnetSindicalDorso: req.files.find(file => file.fieldname === 'carnetSindicalDorso') ? req.files.find(file => file.fieldname === 'carnetSindicalDorso').filename : null
    };

    const attachments = [
      userValues.reciboSueldo && { filename: userValues.reciboSueldo, path: path.resolve(__dirname, 'tmp', userValues.reciboSueldo) },
      userValues.dniFrente && { filename: userValues.dniFrente, path: path.resolve(__dirname, 'tmp', userValues.dniFrente) },
      userValues.dniDorso && { filename: userValues.dniDorso, path: path.resolve(__dirname, 'tmp', userValues.dniDorso) },
      userValues.carnetSindicalFrente && { filename: userValues.carnetSindicalFrente, path: path.resolve(__dirname, 'tmp', userValues.carnetSindicalFrente) },
      userValues.carnetSindicalDorso && { filename: userValues.carnetSindicalDorso, path: path.resolve(__dirname, 'tmp', userValues.carnetSindicalDorso) },
      ...hijos.flatMap((hijo, index) => [
        hijo.dnifrente && { filename: hijo.dnifrente, path: path.resolve(__dirname, 'tmp', hijo.dnifrente) },
        hijo.dnidorso && { filename: hijo.dnidorso, path: path.resolve(__dirname, 'tmp', hijo.dnidorso) },
        hijo.constanciaBoletin && { filename: hijo.constanciaBoletin, path: path.resolve(__dirname, 'tmp', hijo.constanciaBoletin) }
      ]).filter(Boolean)
    ];

    // Prepara el correo electrónico
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
        <h3>Archivos Adjuntos del Usuario</h3>
        <ul>
          <li><strong>Recibo de Sueldo:</strong> ${userValues.reciboSueldo ? `<a href="cid:reciboSueldo">Descargar</a>` : 'No adjunto'}</li>
          <li><strong>DNI Frente:</strong> ${userValues.dniFrente ? `<a href="cid:dniFrente">Descargar</a>` : 'No adjunto'}</li>
          <li><strong>DNI Dorso:</strong> ${userValues.dniDorso ? `<a href="cid:dniDorso">Descargar</a>` : 'No adjunto'}</li>
          <li><strong>Carnet Sindical Frente:</strong> ${userValues.carnetSindicalFrente ? `<a href="cid:carnetSindicalFrente">Descargar</a>` : 'No adjunto'}</li>
          <li><strong>Carnet Sindical Dorso:</strong> ${userValues.carnetSindicalDorso ? `<a href="cid:carnetSindicalDorso">Descargar</a>` : 'No adjunto'}</li>
        </ul>
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
          <h4>Archivos Adjuntos del Hijo ${index + 1}</h4>
          <ul>
            <li><strong>DNI Frente:</strong> ${hijo.dnifrente ? `<a href="cid:dnifrente_${index}">Descargar</a>` : 'No adjunto'}</li>
            <li><strong>DNI Dorso:</strong> ${hijo.dnidorso ? `<a href="cid:dnidorso_${index}">Descargar</a>` : 'No adjunto'}</li>
            <li><strong>Constancia de Alumno Regular o Boletín:</strong> ${hijo.constanciaBoletin ? `<a href="cid:constanciaBoletin_${index}">Descargar</a>` : 'No adjunto'}</li>
          </ul>
        `).join('')}
      `,
      attachments
    };

    // Envía el correo electrónico
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ error: 'Failed to send email' });
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Formulario enviado y correo electrónico enviado exitosamente' });
    });
  } catch (err) {
    console.error('Error processing form data:', err);
    res.status(500).json({ error: 'Failed to process form data' });
  }
});

// Manejo de archivos estáticos
app.use(express.static(path.join(__dirname, './public')));

// Ruta para manejar las demás solicitudes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../utiles/build', 'index.html'));
});

// Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});
const PORT = 0; // Cambiar a 3000 para pruebas locales

// Iniciar el servidor
app.listen(process.env.PORT, () => {
  console.log('Server running at http://localhost/');
});
