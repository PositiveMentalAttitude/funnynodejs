//Router 
var User = require('./userSchema');

var fs = require('fs');

var User = require('./userSchema').User;
var Token = require('./userSchema').Token;

module.exports = function routerjs(app, passport) {

    // app.get('/', (req,res) => {
    //   res.render('index');
    // });

    // create a middleware for exporting log into file

    app.get('/login', (req, res) => {
        res.render('login', { message: req.flash('loginMessage') });
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    //Setup profile page
    //isLoggedIn is an additional middleware to authen that user has logged in or not
    app.get('/profile', isLoggedIn, (req, res) => {
        User.findOne({ _id: req.user._id }).populate('token').exec((err, user) => {
            res.render('profile', { user: user });
        });
    });

    app.get('/success', (req, res) => {
        res.render('success');
    });

    app.get('/index', (req, res) => {
        res.render('index', { message: req.flash('signupMessage') });
    });

    app.get('/failure', (req, res) => {
        res.render('failure', { message: req.flash('signupMessage') });
    });

    app.post('/index', passport.authenticate('local-signup', {
        successRedirect: '/success',
        failureRedirect: '/index',
        failureFlash: true
    }));

    app.get('/logout', (req, res) => {
        //Passpost add logout() function to express
        req.logout();
        res.redirect('/');
    });

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

    app.get('/connect/facebook', passport.authorize('facebook', { scope: ['email'] }));

    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }));

    app.get('/connect/local', (req, res) => {
        res.render('connect-local', { message: req.flash('signupMessage') });
    });

    app.post('/connect/local', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/connect/local',
        failureFlash: true
    }));

    app.get('/unlink/facebook', (req, res) => {
        var user = req.user;

        //To unlink a facebook account, you just need to set the token equal to null,
        //so if the user want to log in back, they have to generate another token
        user.facebook.token = null;

        user.save((err) => {
            if (err)
                throw err;
            res.redirect('/profile');
        });
    });

    app.get('/unlink/local', (req, res) => {
        var user = req.user;

        //To unlink the local account, just delete it.
        //By which, you need to delete the user email.
        user.local.email = null;
        user.local.password = null;

        user.save((err) => {
            if (err)
                throw err;
            res.redirect('/profile');
        });
    });

    app.get('/unlink/google', (req, res) => {
        var user = req.user;

        //Do the same with google
        user.google.token = null;

        user.save((err) => {
            if (err)
                throw err;
            res.redirect('/profile');
        });
    });
    
    // Handle generate Token
    app.get('/getToken', (req, res) => {
        User.findOne({ _id: req.user._id }).populate('token').exec((err, user) => {
            if (err) 
                throw err;
            console.log(user.token);
            if (user.token == null) {
                user.generateToken();
            }
            req.user = user;
            res.redirect('/profile');
        });
    });

    app.get('/testToken', (req, res) => {
        User.findOne({ _id: req.user._id }).populate('token').exec((err, user) => {
            res.json(user);
        });
    });

    app.use(passport.authenticate('bearer',{ session : false }));

    app.use((req, res, next) => {
        fs.appendFile('logs.txt', req.path + " token: " + req.query.access_token + "\n", (err) => {
            //add a callback,if any error occurs, just go next
            next();
        });
    });

    app.get('/api/test', (req, res) => {
        res.send({ SecretData: "abc123" });
    });

    //test params and query
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

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}