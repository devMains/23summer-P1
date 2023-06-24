const express = require('express');
const app = express();
const port = 5000;
const path = require('path');

app.use(express.static(path.join(__dirname, 'css')));

app.get('/', (req, res) => {
    console.log(__dirname + "/htmls/index.html");
    res.sendFile( __dirname + "/htmls/index.html");
});

app.get('/profile', (req, res) => {
    res.sendFile(__dirname + "/htmls/myprofile.html");
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/htmls/login.html");
});

app.get('/page', (req, res) => {
    res.sendFile(__dirname + "/htmls/page.html");
});

app.listen(port, () => {
    console.log(`서버 실행... http://localhost:${port}`);
});