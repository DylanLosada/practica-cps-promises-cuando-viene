const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { get } = require('../request');
const { SERVICIOS } = require('../config');

const MONITOREO = SERVICIOS.monitoreo;

const app = new express();

app.get('/', (res, req) => {
    req.sendFile('index.html', { root: __dirname });
});

function mensaje(contenido) {
    const esTexto = typeof contenido === 'string';
    return JSON.stringify({ msg: contenido, type: esTexto ? 'texto' : 'estados' });
}
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const servicios = Object.values(SERVICIOS).filter(s => s.nombre !== MONITOREO.nombre);

function chequearEstadoServicios(callback) {
    const promesas = servicios.map(servicio => {
        return new Promise(resolve => {
            get(servicio, '/health', (err, data) => {
                resolve({
                    servicio: servicio.nombre,
                    status: err ? 'DOWN' : 'UP'
                });
            });
        });
    });

    Promise.all(promesas).then(estados => callback(estados));
}

wss.on('connection', (ws) => {
    ws.send(mensaje('¡Conectado al monitoreo de servicios!'));

    setInterval(() => {
        chequearEstadoServicios(estados => {
            ws.send(mensaje({ estados }));
        });
    }, 2000);
});


server.listen(MONITOREO.puerto, () => {
    console.log(`[${MONITOREO.nombre}] escuchando en el puerto ${MONITOREO.puerto}`);
});

