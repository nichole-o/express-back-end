var express = require('express');
var router = express.Router();
var models = require('../models');
const authService = require('../services/auth');

// Renders all posts
router.get('/', function (req, res, next) {
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            models.posts.findAll({})
                .then(postFound => {
                    res.render('posts', { posts: postFound });
                });
        });
});

// Creates new post
router.post('/', function (req, res, next) {
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            models.posts.findOrCreate({
                where: {
                    PostTitle: req.body.postTitle,
                    PostBody: req.body.postBody,
                    UserId: user.UserId
                }
            })
                .spread(function (result, created) {
                    console.log(result);
                    if (created) {
                        res.redirect('posts');
                    } else {
                        res.redirect('posts');
                    }
                });
        })

});

// Renders edit posts
router.get('/edit/:id', function (req, res, next) {
    let postId = req.params.id;
    let token = req.cookies.jwt;
    if (token) {
        authService.verifyUser(token)
            .then(user => {
                if (user) {
                    models.posts
                        .findByPk(postId)
                        .then(post => {
                            console.log(post);
                            res.render('editPosts', {
                                post: post,
                                PostId: post.PostId,
                                PostBody: post.PostBody,
                                PostTitle: post.PostTitle
                            })
                        })
                } else {
                    res.send('User not logged in');
                }
            })
    } else {
        res.send('Could not find user');
    }
});

// updates posts
router.post("/edit/:id", function (req, res, next) {
    let postID = parseInt(req.params.id);
    let token = req.cookies.jwt;
    if (token) {
        authService.verifyUser(token).then(user => {
            if (user) {
                models.posts
                    .update(
                        { PostTitle: req.body.postTitle, PostBody: req.body.postBody },
                        { where: { PostId: postID } })
                    .then(user => res.redirect('/posts'));
            } else {
                res.send("Sorry, there was a problem editing this post.");
            }
        });
    }
});

// Deletes post by ID
router.post('/deleted/:id', function (req, res, next) {
    let postId = req.params.id;
    let token = req.cookies.jwt;
    if(token) {
        authService.verifyUser(token)
        .then(user => {
            if (user) {
                models.posts.update({ Deleted: true }, {
                    where: { PostId: postId }
                })
                .then(result => res.redirect('/users/profile'))
            } 
        })
    } else {
        res.send('There was a problem deleting the post')
    }
    
})

module.exports = router;