//Router 
var User = require('./userSchema');
module.exports = function routerjs(app, passport) {

  // app.get('/', (req,res) => {
  //   res.render('index');
  // });

  app.get('/login', (req,res) => {
      res.render('login', { message : req.flash('loginMessage')});
  });

  app.post('/login', passport.authenticate('local-login', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true
  }));

  //Setup profile page
  //isLoggedIn is an additional middleware to authen that user has logged in or not
  app.get('/profile', isLoggedIn, (req,res) => {
      res.render('profile', {user : req.user});
  });

  app.get('/success', (req, res) => {
    res.render('success');
  });

  app.get('/index', (req,res) => {
      res.render('index', { message : req.flash('signupMessage')});
  });

//   app.get('/failure', (req, res) => {
//     res.render('failure', { message: req.flash('signupMessage') });
//   });

  app.post('/index', passport.authenticate('local-signup', {
    successRedirect: '/success',
    failureRedirect: '/index',
    failureFlash: true
  }));

  app.get('/logout', (req,res) => {
      //Passpost add logout() function to express
      req.logout();
      res.redirect('/');
  });

  app.get('/auth/google',passport.authenticate('google',{scope: ['profile','email']}));

  app.get('/auth/google/callback', passport.authenticate('google', {
      successRedirect: '/profile',
      failureRedirect: '/'
  }));

  app.get('/auth/facebook', passport.authenticate('facebook',{scope: ['email']}));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
  }));

  app.get('/:email/:password', (req, res) => {
    var userEmail = req.params.email;
    var userPassword = req.params.password;

    var user = new User();

    //Create a model in mongoDB have these attributes 
    user.local.email = userEmail;
    user.local.password = userPassword;

    console.log(user);

    user.save((err) => {
      if (err)
        throw err;
    });

    res.send('success');
  });
};

function isLoggedIn(req,res,next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}