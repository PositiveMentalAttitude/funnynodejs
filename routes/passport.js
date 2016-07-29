var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

var User = require('./userSchema').User;

var configAuth = require('./auth');

var Token = require('./userSchema').Token;

module.exports = (passport) => {

    //serialize the user from server to the client
    //only the user ID is serialized to the session,
    //keeping the amount of data stored within the session small.
    //When subsequent requests are received, this ID is used to find the user,
    //which will be restored to req.user
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

    //Create a strategy for local signup which named local-signup
    //You can name it whatever you want with LocalStrategy
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
                    //Create a new account
                    if (!req.user) {
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
                    //User has logged in, but still want to sign up another account
                    //And that new account need to be merged with facebook and google
                    //This new accout replaces the old one that had been used to log in before
                    else {
                        //This will create a new user which has the same Object ID in MongoDB
                        //So mongo can replace it with the old one, by save()
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);

                        user.save((err) => {
                            if (err)
                                throw err;
                            return done(null, user)
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
                User.findOne({ 'local.email': email }, (err, user) => {
                    //If any error occurs, return that error
                    if (err) {
                        return done(err);
                    }
                    //if no user found, return null
                    if (!user) {
                        return done(null, false, req.flash('loginMessage', "No User Found"));
                    }
                    if (!user.validPassword(password)) {
                        return done(null, false, req.flash('loginMessage', "Password is incorrect"));
                    }
                    return done(null, user);
                })
            });
        }
    ));

    //Login with facebook strategy

    passport.use(new FacebookStrategy({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'displayName', 'link', 'photos', 'emails'],
        passReqToCallback: true
    }, (req, accessToken, refreshToken, profile, done) => {
        process.nextTick(() => {
            //User has not logged in yet
            console.log(req.user);
            if (!req.user) {
                User.findOne({ 'facebook.id': profile.id }, (err, user) => {
                    if (err) {
                        //return if it has any error
                        return done(err);
                    }
                    if (user) {
                        //If users re-log in by facebook after they unlink from it, 
                        //you need to check the accessToken, if it's null, re-declare it
                        if (!user.facebook.token) {
                            user.facebook.token = accessToken;
                            //Re-declare users's name and email just in case 
                            //their facebook's profiles have changed by the time they unlinked
                            user.facebook.name = profile.displayName;
                            user.facebook.email = profile.emails[0].value;

                            user.save((err) => {
                                if (err)
                                    throw err;
                            });
                        }

                        //return err = null and user
                        return done(null, user);
                    } else {
                        //create a new User if no match found
                        var newUser = new User();
                        newUser.facebook.id = profile.id;
                        newUser.facebook.token = accessToken;
                        newUser.facebook.name = profile.displayName;
                        newUser.facebook.email = profile.emails[0].value;

                        newUser.save((err) => {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                        console.log(profile);
                    }
                });
            }
            //User has logged in already, and need to be merged
            else {
                var user = req.user;
                user.facebook.id = profile.id;
                user.facebook.token = accessToken;
                user.facebook.name = profile.displayName;
                user.facebook.email = profile.emails[0].value;

                user.save((err) => {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));

    //Login with google strategy

    passport.use(new GoogleStrategy({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true
    }, (req, accessToken, refreshToken, profile, done) => {
        process.nextTick(() => {
            if (!req.user) {
                User.findOne({ 'google.id': profile.id }, (err, user) => {
                    if (err) {
                        //return if it has any error
                        return done(err);
                    }
                    if (user) {
                        //Do the same with google
                        if (!user.google.token) {
                            user.google.token = accessToken;
                            user.google.name = profile.displayName;
                            user.google.email = profile.emails[0].value;

                            user.save((err) => {
                                if (err)
                                    throw err;
                            });
                        }

                        //return err = null and user
                        return done(null, user);
                    } else {
                        //create a new User if no match found
                        var newUser = new User();
                        newUser.google.id = profile.id;
                        newUser.google.token = accessToken;
                        newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value;

                        newUser.save((err) => {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                        console.log(profile);
                    }
                });
            }
            else {
                var user = req.user;
                user.google.id = profile.id;
                user.google.token = accessToken;
                user.google.name = profile.displayName;
                user.google.email = profile.emails[0].value;

                user.save((err) => {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));

    //create a passport strategy for token authentication
    passport.use(new BearerStrategy({}, (token, done) => {
        Token.findOne({ value: token }).populate('user').exec((err, token) => {
            if (!token)
                return done(null, false);
            return done(null, token.user);
        });
    }));

    //
    // passport.use(new BearerStrategy({}, (token,done) => {
    //     User.findOne({ _id : token}, (err,user) => {
    //         if (!user)
    //             return done(null,false);
    //         return done(null,user);
    //     });
    // }));
};