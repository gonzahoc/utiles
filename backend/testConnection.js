const http = require('http');
const net = require('net');
const exec = require('child_process').exec;

// Variables para configurar
const DOMAIN = 'stipa.org.ar';
const PORT_TO_TEST = 3000; // Cambia esto al puerto que estás usando
const API_URL = `http://${DOMAIN}:${PORT_TO_TEST}/backend/api/login`;

console.log("======= INICIO DEL SCRIPT DE DIAGNÓSTICO =======");
console.log(`Dominio configurado: ${DOMAIN}`);
console.log(`Puerto que se probará: ${PORT_TO_TEST}`);
console.log(`URL que se probará: ${API_URL}`);

// Función para verificar si el puerto está escuchando
function checkPort(port, callback) {
    console.log(`Verificando si el puerto ${port} está en uso...`);
    const server = net.createServer();
    
    server.once('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            console.log(`El puerto ${port} está en uso. Esto es bueno, significa que algo está escuchando.`);
            callback(null, true); // El puerto está en uso
        } else {
            console.error(`Error desconocido al verificar el puerto ${port}:`, err.message);
            callback(err);
        }
    });
    
    server.once('listening', function () {
        console.log(`El puerto ${port} NO está en uso. Esto podría significar que el servidor no está corriendo.`);
        server.close();
        callback(null, false); // El puerto no está en uso
    });
    
    server.listen(port);
}

// Probar la conectividad con el backend
function testBackendConnectivity(url) {
    console.log(`Intentando conectarse a la URL del backend: ${url}`);
    http.get(url, (res) => {
        console.log(`Conexión exitosa al backend. Estado HTTP: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log(`Respuesta recibida del backend: ${chunk}`);
        });
    }).on('error', (e) => {
        console.error(`Error al conectarse al backend: ${e.message}`);
    });
}

// Probar conectividad con cURL desde el mismo servidor
function testCurlCommand() {
    const command = `curl -I ${API_URL}`;
    console.log(`Ejecutando comando cURL: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando cURL: ${stderr}`);
        } else {
            console.log(`Resultado del comando cURL:\n${stdout}`);
        }
    });
}

// Verificar si el puerto está en uso
checkPort(PORT_TO_TEST, (err, inUse) => {
    if (err) {
        console.error(`Error al verificar el puerto ${PORT_TO_TEST}:`, err.message);
    } else if (inUse) {
        console.log(`\nEl puerto ${PORT_TO_TEST} está en uso. Parece que hay un servicio escuchando.\n`);
        console.log(">>> Intentando conectarse al backend a través de la URL...");
        // Probar la conectividad con el backend
        testBackendConnectivity(API_URL);
        
        console.log("\n>>> Ejecutando cURL para verificar la conectividad externa...");
        // Ejecutar el comando cURL
        testCurlCommand();
    } else {
        console.log(`\nEl puerto ${PORT_TO_TEST} NO está en uso. Esto podría indicar que el servidor backend no está escuchando en el puerto ${PORT_TO_TEST}.`);
        console.log(">>> Verifica si el backend está corriendo y si está configurado para escuchar en el puerto correcto.");
    }
});

console.log("\n======= FIN DEL SCRIPT DE DIAGNÓSTICO =======");
