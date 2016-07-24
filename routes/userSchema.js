//Create a Scheme in MongoDB

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = mongoose.Schema({
    local: {
        email: String,
        password: String
    },

    facebook: {
        id: String,
        token: String,
        email: String,
        name: String
    },

    google: {
        id: String,
        token: String,
        email: String,
        name: String
    }
});

userSchema.methods.generateHash = (password) => {
    //genSaltSync has the default salt round is 10
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
};

// MAGIC HAPPENS !!!!

// userSchema.methods.validPassword = (password, passwordHash) => {
//     return bcrypt.compareSync(password, passwordHash);
// };

userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
}

module.exports = mongoose.model('User',userSchema);