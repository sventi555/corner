const {ObjectID} = require('mongodb');

const {getClient} = require('../db');
const md = require('../md');
const authMiddleware = require('../middlewares/basic-auth');
const {validate, joi} = require('../middlewares/validation');
const {makeHbTemplate} = require('../hbUtils');

function questionsRoutes(app) {
    const PAGE_SIZE = 100;

    const questionTemplate = makeHbTemplate(__dirname, '../templates/questions/question.hbs');
    const questionsTemplate = makeHbTemplate(__dirname, '../templates/questions/questions.hbs');
    app.get('/questions/:id?',
        validate({
            query: joi.object({
                questionContains: joi.string().max(256),
                answerContains: joi.string().max(256),
                page: joi.number().integer().min(0)
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

            const dbQuery = {'answer': {$ne: null}};
            if (req.params.id) {
                dbQuery['_id'] = ObjectID(req.params.id);
                try {
                    const question = await client.db('corner').collection('questions').findOne(dbQuery);
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

            if (req.query.questionContains) {
                dbQuery['question'] = {$regex: `.*${req.query.questionContains}.*`};
            }
            if (req.query.answerContains) {
                dbQuery['answer'].$regex = `.*${req.query.answerContains}.*`;
            }
            const pageNum = req.query.page ? parseInt(req.query.page) : 0;

            try {
                const questions = await client.db('corner').collection('questions').find(dbQuery).sort('timestamp', -1).skip(PAGE_SIZE * pageNum).limit(PAGE_SIZE).toArray();

                if ((req.query.questionContains || req.query.answerContains || req.query.page) && questions.length === 0) return next();

                let isLastPage = false;
                if (questions.length < PAGE_SIZE) {
                    isLastPage = true;
                } else {
                    const nextPageQuestions = await client.db('corner').collection('questions').find(dbQuery).sort('timestamp', -1).skip(PAGE_SIZE * (pageNum + 1)).limit(1).toArray();
                    if (nextPageQuestions.length == 0) isLastPage = true;
                }

                res.send(questionsTemplate({questions, pageNum, isLastPage}));
                return next();
            } catch (err) {
                return next(err);
            } finally {
                await client.close();
            }
        });

    const answerTemplate = makeHbTemplate(__dirname, '../templates/questions/questions-answer.hbs');
    app.get('/questions-answer', authMiddleware(), async (req, res, next) => {
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

    const thanksPage = makeHbTemplate(__dirname, '../templates/questions/questions-thanks.hbs');
    app.get('/questions-thanks', (req, res, next) => {
        res.send(thanksPage({}));
        return next();
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

    app.patch('/api/questions/:id', authMiddleware(), async (req, res, next) => {
        let client;
        try {
            client = await getClient();
        } catch (err) {
            return next(err);
        }

        try {
            await client.db('corner').collection('questions').updateOne({'_id': ObjectID(req.params.id)}, {$set: {'answer': md.render(req.body.answer)}});

            res.sendStatus(200);
            return next();
        } catch (err) {
            return next(err);
        } finally {
            await client.close();
        }
    });

    app.delete('/api/questions/:id', authMiddleware(),
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
                await client.db('corner').collection('questions').deleteOne({'_id': ObjectID(req.params.id)});

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

module.exports = questionsRoutes;
