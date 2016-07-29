var fs = require('fs');

module.exports = (app, passport) => {
    //add a middleware for for token authentication, bearer
    app.use(passport.authenticate('bearer', {session : false}));

    // create a middleware for exporting log into file
    app.use((req, res, next) => {
        fs.appendFile('logs.txt', req.path + " token: " + req.query.access_token + "\n", (err) => {
            //add a callback,if any error occurs, just go next
            if (err) {
                next();
            }
        });
    });

    app.get('/api/test', (req, res) => {
        res.send({ SecretData: "abc123" });
    });
}