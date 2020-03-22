require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const allRoutes = require('./modules');
const envVariables = [
    'TYPE',
    'PROJECT_ID',
    'PRIVATE_KEY_ID',
    'PRIVATE_KEY',
    'CLIENT_EMAIL',
    'CLIENT_ID',
    'AUTH_URI',
    'TOKEN_URI',
    'AUTH_URL',
    'CLIENT_URL',
    'FIREBASE_URL',
    'GEOCODING_API_KEY',
    'DATABASE_URL'
];

app.use(express.json());
app.use(cors());
app.use(allRoutes);

const checkEnv = envVariables.every(variable => process.env[variable]);
const port = process.env['PORT'] || 3000;
if (!checkEnv)
    throw Error('Please provide all the env variables');

mongoose.connect(process.env['DATABASE_URL'], {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    app.listen(port, () => {
        console.log(`API Server started and listening on port ${port}`);
    });
});