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
