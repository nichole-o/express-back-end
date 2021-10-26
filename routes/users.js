var express = require('express');
var router = express.Router();
var models = require('../models');
var authService = require('../services/auth');

// Finds all users
router.get('/', function (req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user.Admin) {
          models.users.findAll({})
            .then(foundUsers => {
              res.render('admin', { users: foundUsers });
            });
        } else {
          res.send('Not authorized');
        }
      });
  } else {
    res.send('You do not have administrative rights');
  }
});

// Renders signup page
router.get('/signup', function (req, res, next) {
  res.render('signup');
});

// Creates new user
router.post('/signup', function (req, res, next) {
  models.users
    .findOrCreate({
      where: {
        Username: req.body.username
      },
      defaults: {
        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        Email: req.body.email,
        Password: authService.hashPassword(req.body.password)
      }
    })
    .spread(function (result, created) {
      if (created) {
        res.redirect('login');
      } else {
        res.send('This user already exists');
      }
    });
});

// Renders login page
router.get('/login', function (req, res, next) {
  res.render('login');
});

// Logs in user and redirects to profile
router.post('/login', function (req, res, next) {
  models.users
    .findOne({
      where: {
        Username: req.body.username
      }
    })
    .then(user => {
      if (!user) {
        console.log('User not found');
        return res.status(401).json({
          message: "Login Failed"
        });
      } else {
        let passwordMatch = authService.comparePasswords(req.body.password, user.Password);
        if (passwordMatch) {
          let token = authService.signUser(user);
          res.cookie('jwt', token);
          res.redirect('profile');
        } else {
          console.log('Wrong password');
          res.send('Wrong password');
        }
      }
    });
});

// logs out user
router.get('/logout', function (req, res, next) {
  res.cookie('jwt', "", { expires: new Date(0) });
  res.send('Logged out');
});

// Renders profile page
router.get('/profile', function (req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user) {
          models.users.findOne({
            where: { UserId: user.UserId },
            include: [{
              model: models.posts,
              where: { Deleted: false },
              required: false
            }]
          })
            .then(userPostsFound => {
              console.log(userPostsFound);
              res.render('profile', {
                Posts: userPostsFound.posts,
                FirstName: userPostsFound.FirstName,
                LastName: userPostsFound.LastName,
                Email: userPostsFound.Email,
                Username: userPostsFound.Username
              });
            })
        } else {
          res.status(401);
          res.send('Must be logged in');
        }
      });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// Allows admin to view profiles by ID
router.get('/profile/:id', function (req, res, next) {
  let userId = req.params.id;
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user.Admin) {
          models.users.findByPk(userId)
            .then(user => {
              res.render('profile', {
                FirstName: user.FirstName,
                LastName: user.LastName,
                Email: user.Email,
                Username: user.Username
              })
            })

        } else {
          res.send('Not Authorized');
        }
      })
  }
});

// Allows admin to delete users
router.post('/deleted/:id', function (req, res, next) {
  let userId = req.params.id;
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user.Admin) {
          models.users.update({ Deleted: true }, {
            where: { UserId: userId }
          })
            .then(result => res.redirect('/users',))
        }
      })
  } else {
    res.send('There was a problem deleting the user');
  }
});

module.exports = router;
