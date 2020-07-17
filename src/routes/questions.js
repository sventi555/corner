
const basicAuth = require('express-basic-auth');
const {ObjectID} = require('mongodb');

const {getClient} = require('../db');
const {validate, joi} = require('../middlewares/validation');
const {makeHbTemplate} = require('../utils');

const {CORNER_PASSWORD} = process.env;

function questionsRoutes(app) {
    const questionTemplate = makeHbTemplate(__dirname, '../templates/question.hbs');
    const questionsTemplate = makeHbTemplate(__dirname, '../templates/questions.hbs');
    app.get('/questions/:id?',
        validate({
            query: joi.object({
                questionContains: joi.string().max(256),
                answerContains: joi.string().max(256)
            }),
            params: joi.object({
                id: joi.string().length(24)
            })
        }), async (req, res, next) => {
            let client;
            try {
                client = await getClient();
            } catch (err) {
                return next(err);
            }

            if (req.params.id) {
                try {
                    const question = await client.db('corner').collection('questions').findOne({'_id': ObjectID(req.params.id)});
                    if (!question) {
                        return next();
                    }

                    res.send(questionTemplate({question}));
                    return next();
                } catch(err) {
                    return next(err);
                } finally {
                    await client.close();
                }
            }

            const dbQuery = {'answer': {$ne: null}};
            if (req.query.questionContains) {
                dbQuery['question'] = {$regex: `.*${req.query.questionContains}.*`};
            }
            if (req.query.answerContains) {
                dbQuery['answer'].$regex = `.*${req.query.answerContains}.*`;
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

            res.redirect('/questions-thanks');
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.patch('/api/questions/:id', basicAuth({challenge: true, users:{'admin': CORNER_PASSWORD}}), async (req, res, next) => {
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
    app.get('/questions-answer', basicAuth({challenge: true, users:{'admin': CORNER_PASSWORD}}), async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            const questions = await client.db('corner').collection('questions').find({'answer': {$eq: null}}).sort('timestamp', 1).toArray();

            res.send(answerTemplate({questions, numOfQuestions: questions.length}));
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    const thanksPage = makeHbTemplate(__dirname, '../templates/questions-thanks.hbs');
    app.get('/questions-thanks', (req, res, next) => {
        res.send(thanksPage({}));
        return next();
    });
}

module.exports = questionsRoutes;
