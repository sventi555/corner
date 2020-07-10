// TODO make trello for tracking issues/tasks
// TODO upload to git
// TODO talk with shables this weekend about design
// TODO document routes/methods
// TODO write manifests
// TODO check health of mongo before starting http server
// TODO make util for compiling hbs template from file
// TODO make mongo interactions use async/await
const express = require('express');

const musicRoutes = require('./src/routes/music');
const questionsRoutes = require('./src/routes/questions');

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.use(express.static('./media'));
app.use(express.static('./static'));

musicRoutes(app);
questionsRoutes(app);

app.listen(3000);
