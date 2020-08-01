const {ObjectID} = require('mongodb');

const {getClient} = require('../db');
const {makeHbTemplate} = require('../hbUtils');
const authMiddleware = require('../middlewares/basic-auth');
const {validate, joi} = require('../middlewares/validation');

function notesRoutes(app) {
    const PAGE_SIZE = 100;

    const notesTemplate = makeHbTemplate(__dirname, '../templates/notes/notes.hbs');

    app.get('/notes', validate({query: joi.object({page: joi.number().integer().min(0)})}), async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        const pageNum = req.query.page ? parseInt(req.query.page) : 0;

        try {
            const notes = await client.db('corner').collection('notes').find({}).sort('timestamp', -1).skip(PAGE_SIZE * pageNum).limit(PAGE_SIZE).toArray();

            let isLastPage = false;
            if (notes.length < PAGE_SIZE) {
                isLastPage = true;
            } else {
                const nextPageNotes = await client.db('corner').collection('notes').find({}).sort('timestamp', -1).skip(PAGE_SIZE * (pageNum + 1)).limit(1).toArray();
                if (nextPageNotes.length == 0) isLastPage = true;
            }

            res.send(notesTemplate({notes, pageNum, isLastPage}));
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    const uploadTemplate = makeHbTemplate(__dirname, '../templates/notes/notes-upload.hbs');
    app.get('/notes-upload', authMiddleware(), async (req, res, next) => {
        res.send(uploadTemplate({}));
        return next();
    });

    app.post('/api/notes', authMiddleware(), async (req, res, next) => {
        const receivedAt = Date.now();

        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const notes = client.db('corner').collection('notes');
            await notes.insertOne({
                timestamp: receivedAt,
                note: req.body.note
            });

            res.redirect('/notes');
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.delete('/api/notes/:id', authMiddleware(),
        validate({
            params: joi.object({
                id: joi.string().length(24)
            })
        }),
        async (req, res, next) => {
            let client;
            try {
                client = await getClient();
            } catch (err) {
                return next(err);
            }

            try {
                await client.db('corner').collection('notes').deleteOne({'_id': ObjectID(req.params.id)});

                res.status(204).send();
                return next();
            } catch(err) {
                return next(err);
            } finally {
                client.close();
            }
        }
    );
}

module.exports = notesRoutes;
