
const basicAuth = require('express-basic-auth');
const {ObjectID} = require('mongodb');

const {getClient} = require('../db');
const {validate, joi} = require('../middlewares/validation');
const {makeHbTemplate} = require('../utils');

function questionsRoutes(app) {
    const questionsTemplate = makeHbTemplate(__dirname, '../templates/questions.hbs');

    app.get('/questions', validate({query: joi.object({date: joi.string().pattern(/^[0-1][0-9]-[0-9]{4}$/)})}), async (req, res, next) => {
        const dbQuery = {'answer': {$ne: null}};

        if (req.query.date) {
            const month = parseInt(req.query.date.substring(0, 2));
            const year = parseInt(req.query.date.substring(3));

            const monthStart = new Date(Date.UTC(year, month - 1));
            const nextMonthStart = new Date(Date.UTC(year, month));
            dbQuery['timestamp'] = {$gte: monthStart.getTime(), $lt: nextMonthStart.getTime()};
        }

        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const questions = await client.db('corner').collection('questions').find(dbQuery).sort('timestamp', -1).limit(100).toArray();

            res.send(questionsTemplate({questions}));
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.get('/api/questions', basicAuth({challenge: true, users:{'admin': process.env.CORNER_PASSWORD}}), async (req, res, next) => {
        const dbQuery = {};

        if (req.query.answered === 'true') {
            dbQuery['answer'] = {$ne: null};
        } else if (req.query.answered === 'false') {
            dbQuery['answer'] = {$eq: null};
        }

        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const questions = await client.db('corner').collection('questions').find(dbQuery).sort('timestamp', -1).toArray();

            res.json({questions});
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.post('/api/questions', validate({body: joi.object({question: joi.string().max(256).required()}).required()}), async (req, res, next) => {
        const receivedAt = Date.now();

        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const questions = client.db('corner').collection('questions');
            await questions.insertOne({timestamp: receivedAt, question: req.body.question, answer: null});

            res.redirect('/questions/thanks');
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.patch('/api/questions/:id', basicAuth({challenge: true, users:{'admin': process.env.CORNER_PASSWORD}}), async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            await client.db('corner').collection('questions').updateOne({'_id': ObjectID(req.params.id)}, {$set: {'answer': req.body.answer}});

            res.sendStatus(200);
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    const answerTemplate = makeHbTemplate(__dirname, '../templates/questions-answer.hbs');
    app.get('/questions/answer', basicAuth({challenge: true, users:{'admin': process.env.CORNER_PASSWORD}}), async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const questions = await client.db('corner').collection('questions').find({'answer': {$eq: null}}).sort('timestamp', 1).toArray();

            res.send(answerTemplate({questions}));
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    const thanksPage = makeHbTemplate(__dirname, '../templates/questions-thanks.hbs');
    app.get('/questions/thanks', (req, res, next) => {
        res.send(thanksPage({}));
        return next();
    });
}

module.exports = questionsRoutes;
