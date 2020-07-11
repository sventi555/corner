const fs = require('fs');
const path = require('path');

const basicAuth = require('express-basic-auth');
const hb = require('handlebars');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');

function musicRoutes(app) {
    const musicTemplate = hb.compile(fs.readFileSync(path.join(__dirname, '../templates/music.hbs'), 'utf8'));
    const musicUpload = multer({ dest: 'media/music' });

    app.get('/music', async (req, res, next) => {
        try {
            const client = await MongoClient.connect(process.env.MONGO_URL);
            const songs = await client.db('corner').collection('songs').find().sort('timestamp', -1).limit(100).toArray();

            res.send(musicTemplate({ songs }));
            return next();
        } catch (err) {
            return next(err);
        }
    });

    app.post('/api/music', basicAuth({ users:{'admin': process.env.CORNER_PASSWORD} }), musicUpload.single('song'), async (req, res, next) => {
        const receivedAt = Date.now();

        try {
            const client = await MongoClient.connect(process.env.MONGO_URL);

            const songs = client.db('corner').collection('songs');
            await songs.insertOne({timestamp: receivedAt, originalName: req.file.originalname, filename: req.file.filename});

            res.sendStatus(200);
            return next();
        } catch (err) {
            return next(err);
        }
    });
}

module.exports = musicRoutes;
