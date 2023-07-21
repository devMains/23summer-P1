const express = require('express');
const session = require('express-session');
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');
const app = express();
const port = 5000;
const path = require('path');

const kakaoClientId = '50d56ef1dc41372917d10703fb6c26de';
const kakaoCallbackURL = 'http://localhost:5000/auth/kakao/callback'

app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static('js'));
app.use(express.static('img'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(session({ secret : 'XgeEpm943y1NDd6movh9JKknszOOyoeR', resave: true, saveUninitialized: true}))
app.use(passport.initialize());
app.use(passport.session());

const mongoURI = "mongodb+srv://mainsdev:1q2w3e4r!@cluster0.v3mragw.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=> console.log('mongodb connected'))
    .catch(err => console.log(err));

const Post = mongoose.model('post', {
    title: String,
    content: String,
    replies: [String],
    postTime: String,
    displayName: String,
    userId: String
});

const User = mongoose.model('user', {
    userId: String,
    displayName: String,
    point: Number
});

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err);
        });
});

passport.use(new KakaoStrategy({
    clientID : kakaoClientId,
    callbackURL: kakaoCallbackURL
},
function (accessToken, refreshToken, profile, done) {
    User.findOne({ kakaoId: profile.id })
        .then(existingUser => {
            if(existingUser) {
                return done(null, existingUser);
            } else {              
                const newUser = new User({
                    userId: profile.id,
                    displayName: profile.displayName,
                    point: 0
                });
                return newUser.save().then(newUser => done(null, newUser));;
            }
        })
        .catch(err => {
            return done(err);
        });
}));

app.get('/auth/kakao', passport.authenticate('kakao'));

app.get('/auth/kakao/callback',
    passport.authenticate('kakao', {failureRedirect: '/'}),
    function(req, res) {
        res.redirect('/');
    });

app.get('/api/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        res.json({
            displayName : req.user.displayName,
            userId: req.user.userId
        });
    }
    else {
        res.json({'login' : 'fail'});
    }
});


app.get('/', (req, res) => {
    if (req.isAuthenticated()){
        console.log("로그인 성공." + req.user.displayName);
    }
    res.sendFile( __dirname + "/htmls/index.html");
});

app.get('/profile', (req, res) => {
    res.render('profile', {user: req.user.displayName});
});

app.get('/login', (req, res) => {
    if (!req.isAuthenticated()) {
       res.sendFile(__dirname + "/htmls/kakao_login.html"); 
    }
    else{
        res.render('profile', {user: req.user.displayName});
    }
    
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
    const { title, content, postTime} = req.body;
    const { displayName, userId } = req.body;

    const newPost = new Post({title, content, postTime: getCurrentDateTime(), displayName, userId});
    newPost.save()
        .then(posts => res.json(posts))
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
    function getCurrentDateTime() {
        const curr = new Date();
        const utc = curr.getTime() + (curr.getTimezoneOffset() * 60 * 1000);
        const now = new Date(utc + (9 * 60 * 60 * 1000));
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');            
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
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
  
    Post.findByIdAndRemove(id)
      .then(() => res.sendStatus(200))
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });
  });


app.listen(port, () => {
    console.log(`서버 실행... http://localhost:${port}`);
});