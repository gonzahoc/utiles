const allowedOrigin = 'https://stipa.org.ar';
const corsOptions= {
    origin:allowedOrigin, // Permitir ambos dominios
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
  };
module.exports = {
    allowedOrigin,
    corsOptions
}