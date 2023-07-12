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
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mongoURI = "mongodb+srv://mainsdev:1q2w3e4r!@cluster0.v3mragw.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=> console.log('mongodb connected'))
    .catch(err => console.log(err));

const Post = mongoose.model('post', {
    title: String,
    content: String,
    replies: [String]
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

app.get('/delete', (req, res) => {
    res.sendFile(__dirname + "/htmls/admin.html");
});

app.get('/detail', (req, res) => {
    res.sendFile(__dirname + "/htmls/detail_page.html");
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

app.get('/post/:id', (req, res) => {
    const { id } = req.params;

    Post.findById(id)
        .then(post => {
            if (!post) {
                res.sendStatus(404);
            } else {
                console.log(post);
                res.render('detail_page', { post }); // 수정된 부분
            }
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.post('/api/posts/:id/reply', (req, res) => {
    const postId = req.params.id;
    const { reply } = req.body;

    Post.findById(postId)
        .then(post => {
            if(!post) {
                return res.status(404).json({error:"게시물이 없음."});
            }

            if(!Array.isArray(post.replies)) {
                post.replies = [];
            }

            post.replies.push( reply );

            return post.save();
        })
        .then(savedPost => {
            res.json(savedPost);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: '서버 오류 발생.'})
        })
})

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