const express = require('express');
const { colectivoMasCercano } = require('../ubicacion');
const { get } = require('../request');
const { healthCheck } = require('../middleware.js');
const { SERVICIOS } = require('../config');
const { fetchParada, fetchLinea } = require('./fetchs');

const {cuandoViene, lineas, monitoreo, paradas } = SERVICIOS;

const app = new express();

app.use(healthCheck);

app.get('/v1/cuando-viene/:parada', (req, res) => {
    const parada = req.params.parada;

    // Validamos que la parada sea un número
    if (isNaN(parada)) {
        return res.status(400).json({ error: 'La parada debe ser un número' });
    }

    // Queremos obtener, para cada linea de la parada, el próximo colectivo que va a llegar
    new Promise((resolve, reject) => {
       get(paradas, `/paradas/${parada}`, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    })
    .then(paradaInfo => {
        // Si no hay información de la parada, devolvemos un error
        if (paradaInfo.error) {
            return res.status(404).json({ error: 'No se encontró información para la parada' });
        }
        
        lineasPromises = paradaInfo.lineas.map(linea => new Promise((resolve, reject) => {
                get(lineas, `/lineas/${linea}`, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    data.ubicacacionParada = paradaInfo.ubicacion;
                    data.linea = linea;
                    resolve(data);
                })
        })) 
        
        return Promise.all(lineasPromises)
    })
    .then(lineasInfo => {
        // Para cada linea, obtenemos el colectivo más cercano
        const colectivosCercanos = lineasInfo.map(linea => colectivoMasCercano(linea, linea.ubicacacionParada));
        
        // Devolvemos la información de los colectivos más cercanos
        res.json({
            parada: parada,
            coletivos_cercanos: colectivosCercanos
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor' });
    });

});

app.get('/v2/cuando-viene/:parada', async (req, res) => {
    const parada = req.params.parada;

    if (isNaN(parada)) {
        return res.status(400).json({ error: 'La parada debe ser un número' });
    }

    try {
        const paradaInfo = await fetchParada(parada, paradas);
        if (!paradaInfo) {
            return res.status(404).json({ error: `Parada: ${parada} no encontrada` });
        }

        const lineasInfo = await Promise.all(
            paradaInfo.lineas.map(lineaId => fetchLinea(lineaId, paradaInfo.ubicacion, lineas))
        );

        const colectivosCercanos = lineasInfo.map(linea =>
            colectivoMasCercano(linea, linea.ubicacionParada)
        );

        res.json({
            parada: parada,
            coletivos_cercanos: colectivosCercanos
        });
    } catch (err) {
        console.error('Error en /cuando-viene:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(cuandoViene.puerto, () => {
    console.log(`[${cuandoViene.nombre}] escuchando en el puerto ${cuandoViene.puerto}`);
});

