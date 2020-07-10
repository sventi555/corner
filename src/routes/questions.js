
const fs = require('fs');
const path = require('path');

const basicAuth = require('express-basic-auth');
const hb = require('handlebars');
const MongoClient = require('mongodb').MongoClient;

const {validate, joi} = require('../middlewares/validation');

function questionsRoutes(app) {
    const questionsTemplate = hb.compile(fs.readFileSync(path.join(__dirname, '../templates/questions.hbs'), 'utf8'));

    app.get('/questions', validate({query: joi.object({date: joi.string().pattern(/^[0-1][0-9]-[0-9]{4}$/)})}), (req, res, next) => {

        MongoClient.connect(process.env.MONGO_URL, (err, client) => {
            if (err) {
                res.sendStatus(500);
                return next(err);
            }

            const dbQuery = {'answer': {$ne: null}};

            if (req.query.date) {
                const month = parseInt(req.query.date.substring(0, 2));
                const year = parseInt(req.query.date.substring(3));

                const monthStart = new Date(Date.UTC(year, month - 1));
                const nextMonthStart = new Date(Date.UTC(year, month));
                dbQuery['timestamp'] = {$gte: monthStart.getTime(), $lt: nextMonthStart.getTime()};
            }

            client.db('corner').collection('questions').find(dbQuery).sort('timestamp', -1).limit(100).toArray((err, result) => {
                if (err) {
                    res.sendStatus(500);
                    return next(err);
                }

                res.send(questionsTemplate({ questions: result }));
                return next();
            });
        });
    });


    app.get('/api/questions', basicAuth({ challenge: true, users:{'admin': process.env.CORNER_PASSWORD} }), (req, res, next) => {
        MongoClient.connect(process.env.MONGO_URL, (err, client) => {
            if (err) {
                res.sendStatus(500);
                return next(err);
            }

            const dbQuery = {};

            if (req.query.answered === 'true') {
                dbQuery['answer'] = {$ne: null};
            } else if (req.query.answered === 'false') {
                dbQuery['answer'] = {$eq: null};
            }

            client.db('corner').collection('questions').find(dbQuery).sort('timestamp', -1).toArray((err, result) => {
                if (err) {
                    res.sendStatus(500);
                    return next(err);
                }

                res.json({ questions: result });
                return next();
            });
        });
    });


    app.post('/api/questions', validate({body: joi.object({question: joi.string().max(256).required()}).required()}), (req, res, next) => {
        const receivedAt = Date.now();

        MongoClient.connect(process.env.MONGO_URL, (err, client) => {
            if (err) {
                res.sendStatus(500);
                return next(err);
            }
            const questions = client.db('corner').collection('questions');
            questions.insertOne({timestamp: receivedAt, question: req.body.question, answer: null}, (err) => {
                if (err) {
                    res.sendStatus(500);
                    return next(err);
                }
            });
        });

        res.redirect('/questions/thanks');
        return next();
    });

    const thanksPage = fs.readFileSync(path.join(__dirname, '../templates/questions-thanks.html'), 'utf8');
    app.get('/questions/thanks', (req, res, next) => {
        res.send(thanksPage);
        return next();
    });
}

module.exports = questionsRoutes;
