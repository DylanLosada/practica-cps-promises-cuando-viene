const { get } = require('../request');

function fetchParada(paradaId, paradasEndpoint) {
    return new Promise((resolve, reject) => {
        get(paradasEndpoint, `/paradas/${paradaId}`, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function fetchLinea(lineaId, ubicacionParada, lineasEndpoint) {
    return new Promise((resolve, reject) => {
        get(lineasEndpoint, `/lineas/${lineaId}`, (err, data) => {
            if (err) return reject(err);
            data.ubicacionParada = ubicacionParada;
            data.linea = lineaId;
            resolve(data);
        });
    });
}

module.exports = {
    fetchParada,
    fetchLinea,
};