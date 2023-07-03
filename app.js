const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;
const path = require('path');

app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static('js'));
app.use(express.static('img'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mongoURI = "mongodb+srv://mainsdev:1q2w3e4r!@cluster0.v3mragw.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=> console.log('mongodb connected'))
    .catch(err => console.log(err));

const Post = mongoose.model('post', {
    title: String,
    content: String
})


app.get('/', (req, res) => {
    res.sendFile( __dirname + "/htmls/index.html");
});

app.get('/profile', (req, res) => {
    res.sendFile(__dirname + "/htmls/myprofile.html");
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/htmls/kakao_login.html");
});

app.get('/page', (req, res) => {
    res.sendFile(__dirname + "/htmls/page.html");
});

app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;

    const newPost = new Post({title, content});
    newPost.save()
        .then(posts => res.json(posts))
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.get('/api/posts', (req, res) => {
    Post.find({})
        .then(posts => res.json(posts))
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    Post.findByIdAandUpdate(id, { title, content })
        .then(()=> res.sendStatus(200))
        .catch(err => {
            console.log(err);
            res.sendStatuse(500);
        })
})

app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
  
    Post.findOneAndRemove(id)
      .then(() => res.sendStatus(200))
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });
  });


app.listen(port, () => {
    console.log(`서버 실행... http://localhost:${port}`);
});