require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

app.use(
    '/kave',
    require('./routes/kave')
);

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    );

});

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log('');
    console.log('====================================');
    console.log(' Generador Kave iniciado');
    console.log(` Puerto: ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log('====================================');
    console.log('');

});