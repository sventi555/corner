const fs = require('fs');
const path = require('path');

const basicAuth = require('express-basic-auth');
const hb = require('handlebars');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');

function musicRoutes(app) {
    const musicTemplate = hb.compile(fs.readFileSync(path.join(__dirname, '../templates/music.hbs'), 'utf8'));
    const musicUpload = multer({ dest: 'media/music' });

    app.get('/music', (req, res, next) => {
        MongoClient.connect(process.env.MONGO_URL, (err, client) => {
            if (err) {
                res.sendStatus(500);
                return next(err);
            }

            client.db('corner').collection('songs').find().sort('timestamp', -1).limit(100).toArray((err, result) => {
                if (err) {
                    res.sendStatus(500);
                    return next(err);
                }

                res.send(musicTemplate({ songs: result }));
                return next();
            });
        });
    });

    app.post('/api/music', basicAuth({ users:{'admin': process.env.CORNER_PASSWORD} }), musicUpload.single('song'), (req, res, next) => {
        const receivedAt = Date.now();

        if (req.file.mimetype != 'audio/mpeg') {
            res.json({ error: 'Filetype must be "audio/mpeg"'}).status(400).send();
            return next();
        }

        MongoClient.connect(process.env.MONGO_URL, (err, client) => {
            if (err) {
                res.sendStatus(500);
                return next(err);
            }
            const songs = client.db('corner').collection('songs');
            songs.insertOne({timestamp: receivedAt, originalName: req.file.originalname, filename: req.file.filename}, (err) => {
                if (err) {
                    res.sendStatus(500);
                    return next(err);
                }
            });
        });

        res.sendStatus(200);
        return next();
    });
}

module.exports = musicRoutes;
