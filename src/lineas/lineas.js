const express = require('express');
const fs = require('fs');
const path = require('path');
const { SERVICIOS } = require('../config');
const { healthCheck } = require('../middleware.js');
const { actualizarUbicaciones } = require('./actualizarUbicaciones');

const LINEAS = SERVICIOS.lineas;

const lineasDb = {
    buscarPorLinea(linea, callback) {
        const archivo = path.join(__dirname, 'lineas.db.json');
        
        fs.readFile(archivo, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error leyendo base de datos de líneas: ${err}`);
                return callback(err, null);
            }

            try {
                const json = JSON.parse(data);
                const estado = json[linea];
                callback(null, estado);
            } catch (parseError) {
                console.error(`Error parseando JSON de líneas: ${parseError}`);
                callback(parseError, null);
            }
        });
    }
};

const app = new express();

app.use(healthCheck);

app.get('/lineas/:linea', (req, res) => {
    const linea = req.params.linea;
    new Promise((resolve, reject) => {
        lineasDb.buscarPorLinea(linea, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        })
    })
    .then(lineaInfo => {
            // Si no hay información de la línea, devolvemos un error
            if (!lineaInfo) {
                return res.status(404).json({ error: 'No se encontró información para la línea' });
            }
            res.json(lineaInfo);
    })
    .catch(err => {
        console.error(`Error obteniendo información de la línea ${linea}: ${err}`);
        res.status(500).json({ error: 'Error interno del servidor' });
    });
});

app.listen(LINEAS.puerto, () => {
    console.log(`[${LINEAS.nombre}] escuchando en el puerto ${LINEAS.puerto}`);
    // actualizarUbicaciones();
});
