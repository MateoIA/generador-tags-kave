const Firebird = require('node-firebird');

const options = {
    host: process.env.FB_HOST,
    port: Number(process.env.FB_PORT || 3050),
    database: process.env.FB_DATABASE,
    user: process.env.FB_USER,
    password: process.env.FB_PASSWORD,
    lowercase_keys: false,
    role: null,
    pageSize: 4096
};

module.exports = {

    query(sql, params = []) {

        return new Promise((resolve, reject) => {

            Firebird.attach(options, (err, db) => {

                if (err) {
                    reject(err);
                    return;
                }

                db.query(sql, params, (err, result) => {

                    db.detach();

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(result);
                });
            });
        });
    }
};