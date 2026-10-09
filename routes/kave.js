const express = require('express');
const router = express.Router();
const firebird = require('../services/firebird');
const fs = require('fs');
const path = require('path');
const LOG_DIR =
    path.join(__dirname, '..', 'logs');

const LOG_FILE =
    path.join(LOG_DIR, 'kave.log');

if (!fs.existsSync(LOG_DIR)) {

    fs.mkdirSync(LOG_DIR);
}

const sql = `
    SELECT
        ped.rig AS PEDIDO,
        ped.linea AS LINEA,

        SUBSTRING(
            ped.referencia
            FROM 1 FOR (
                POSITION(' ' IN ped.referencia) - 1
            )
        ) AS REFERENCIA,

        TRIM(ped.cod_sku) AS ARTICULO,

        SUBSTRING(
            sku.descripcion_art_sku
            FROM 1 FOR (
                POSITION(' ' IN sku.descripcion_art_sku) - 1
            )
        ) AS COD_SKU,

        CASE
            WHEN POSITION('#' IN sku.descripcion_art_sku) > 0 THEN
                SUBSTRING(
                    sku.descripcion_art_sku
                    FROM (
                        POSITION(' ' IN sku.descripcion_art_sku) + 1
                    )
                    FOR (
                        POSITION('#' IN sku.descripcion_art_sku)
                        - POSITION(' ' IN sku.descripcion_art_sku)
                        - 2
                    )
                )
            ELSE
                SUBSTRING(
                    sku.descripcion_art_sku
                    FROM (
                        POSITION(' ' IN sku.descripcion_art_sku) + 1
                    )
                )
        END AS TITULO,

        CASE
            WHEN POSITION('#' IN sku.descripcion_art_sku) > 0 THEN
                SUBSTRING(
                    sku.descripcion_art_sku
                    FROM (
                        POSITION('#' IN sku.descripcion_art_sku) + 1
                    )
                )
            ELSE
                '1.1'
        END AS VERSION,

        sku.descripcion_art_sku AS DESCRIPCION_ART_SKU,

        tel.titulo AS TELA,

        ped.ref_habitat AS EAN,

        pmp.cod_barra AS COD_BARRA,

        pmp.tag2 AS TAG2,

        SUBSTRING(
            pmp.cod_barra
            FROM 10 FOR 14
        ) AS NO_ORDEN

    FROM ges_detalles_s_ped ped

    JOIN emp_pro_pmp_cbarras pmp
        ON ped.empresa = pmp.empresa
       AND ped.ejercicio = pmp.ejercicio
       AND ped.canal = pmp.canal
       AND ped.serie = pmp.serie
       AND ped.tipo = pmp.tipo
       AND ped.rig = pmp.rig
       AND ped.linea = pmp.linea

    JOIN art_articulos_sku sku
        ON ped.empresa = sku.empresa
       AND TRIM(ped.cod_sku) = sku.cod_sku
       AND sku.cliente = 6800

    LEFT JOIN ges_detalles_s_composicion tel
        ON ped.empresa = tel.empresa
       AND ped.ejercicio = tel.ejercicio
       AND ped.canal = tel.canal
       AND ped.serie = tel.serie
       AND ped.tipo = tel.tipo
       AND ped.rig = tel.rig
       AND ped.linea = tel.linea

    WHERE
        ped.empresa = 1
        AND ped.ejercicio >= 2026
        AND ped.canal = 1
        AND ped.serie = 'FV'
        AND ped.tipo = 'PEC'
        AND ped.rig BETWEEN ? AND ?

    ORDER BY
        ped.rig,
        ped.linea
`;


function escapeCsv(value) {

    if (value === null || value === undefined) {
        return '';
    }

    const text = String(value);

    const escaped = text.replace(/"/g, '""');

    if (
        escaped.includes(';') ||
        escaped.includes('"') ||
        escaped.includes('\n') ||
        escaped.includes('\r')
    ) {
        return `"${escaped}"`;
    }

    return escaped;
}

router.get('/info', async (req, res) => {

    const desde =
        parseInt(req.query.desde, 10);

    const hasta =
        parseInt(req.query.hasta, 10);

    try {

        const rows =
            await firebird.query(
                sql,
                [desde, hasta]
            );

        res.json({
            ok: true,
            lineas: rows.length
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            error: err.message
        });
    }
});

router.get('/csv', async (req, res) => {

    const desde =
        parseInt(req.query.desde, 10);

    const hasta =
        parseInt(req.query.hasta, 10);

    const ip =
        req.headers['x-forwarded-for']
        || req.socket.remoteAddress
        || 'DESCONOCIDA';

    try {
        const inicio = Date.now();
        console.log(
            `${new Date().toISOString()} | KAVE | Inicio CSV ${desde}-${hasta}`
        );

        const rows =
            await firebird.query(
                sql,
                [desde, hasta]
            );
        const tiempo = ((Date.now() - inicio) / 1000).toFixed(2);
        console.log(
            `${new Date().toISOString()} | KAVE | Pedidos ${desde}-${hasta} | ${rows.length} líneas | ${tiempo} segundos`
        );
        const fecha =
             new Date()
                .toISOString()
                .replace('T', ' ')
                .substring(0, 19);

        const fileName =
            `kave_home_${desde}_${hasta}.csv`.toLowerCase();

        const logLine =
            `${fecha} | APP=KAVE | IP=${ip} | DESDE=${desde} | HASTA=${hasta} | LINEAS=${rows.length} | TIEMPO=${tiempo}s | CSV=${fileName}\r\n`;
 
            fs.appendFileSync(
            LOG_FILE,
            logLine,
            'utf8'
        );    

        res.setHeader(
            'Content-Type',
            'text/csv; charset=utf-8'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
        );

        // BOM UTF-8 para Excel
        res.write('\uFEFF');

        res.write(
            'PEDIDO;LINEA;REFERENCIA;ARTICULO;COD_SKU;TITULO;VERSION;DESCRIPCION_ART_SKU;TELA;EAN;COD_BARRA;TAG2;NO_ORDEN\r\n'
        );

        rows.forEach(row => {

            const csvRow = [

                row.PEDIDO,
                row.LINEA,
                row.REFERENCIA,
                row.ARTICULO,
                row.COD_SKU,
                row.TITULO,
                row.VERSION,
                row.DESCRIPCION_ART_SKU,
                row.TELA,
                row.EAN,
                row.COD_BARRA,
                row.TAG2,
                row.NO_ORDEN

            ].map(escapeCsv);

            res.write(
                csvRow.join(';') + '\r\n'
            );

        });

        res.end();

    } catch (err) {

        console.error(err);

        const fecha =
            new Date()
                .toISOString()
                .replace('T', ' ')
                .substring(0, 19);
        
        const errorLine =
            `${fecha} | APP=KAVE | ERROR=${err.message}\r\n`;

        try {
            fs.appendFileSync(
                LOG_FILE,
                errorLine,
                'utf8'
            );

        } catch (logErr) {
            console.error('Error escribiendo log:', logErr);
        }

        res
            .status(500)
            .send(err.message);

    }
});

module.exports = router;