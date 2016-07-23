var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var User = require('./userSchema');

var configAuth = require('./authFacebook');

module.exports = (passport) => {

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            if (err)
                throw err;
            else {
                done(err, user);
            }
        })
    });

    //Create a strategy for local signup
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        (req, email, password, done) => {
            //This session does not execute until anything else is done
            process.nextTick(() => {
                User.findOne({ 'local.email': email }, (err, user) => {
                    //If any error occurs, return that error
                    if (err) {
                        return done(err);
                    }
                    //If not, check the existence of the incoming email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email already taken'));
                    }
                    //Finally, create an email
                    else {
                        var newUser = new User();
                        newUser.local.email = email;
                        //Encrypt password
                        newUser.local.password = newUser.generateHash(password);

                        newUser.save((err) => {
                            if (err)
                                throw err;
                            return done(null, newUser)
                        });
                    }

                })
            });
        }
    ));

    //Create a strategy for local login
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        (req, email, password, done) => {
            process.nextTick(() => {
                User.findOne({'local.email': email}, (err,user) => {
                    //If any error occurs, return that error
                    if (err) {
                        return done(err);
                    } 
                    //if no user found, return null
                    if (!user) {
                        return done(null, false, req.flash('loginMessage',"No User Found"));
                    } if (!user.validPassword(password)) {
                        return done(null, false, req.flash('loginMessage',"Password is incorrect"));
                    }
                    return done(null,user);
                })
            });
        }
    ));

    //Login with facebook strategy

    passport.use(new FacebookStrategy({
        clientID : configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => {
            User.findOne({'facebook.id': profile.id}, (err,user) => {
                if (err) {
                    //return if it has any error
                    return done(err);
                }
                if (user) {
                    //return err = null and user
                    return done(null,user);
                } else {
                    //create a new User if no match found
                    var newUser = new User();
                    newUser.facebook.id = profile.id;
                    newUser.facebook.token = accessToken;
                    newUser.facebook.name = profile.displayName;
                    // SUMTING WONG CANT GET THE SHITTY EMAIL WTF???
                    // newUser.facebook.email = profile.emails[0].value;

                    newUser.save((err) => {
                        if (err) {
                            throw err;
                        }
                        return done(null,newUser);
                    });  
                }
            });
        });
    }));
};