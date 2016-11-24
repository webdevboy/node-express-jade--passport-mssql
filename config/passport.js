// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');

var sql       = require('mssql');
var dbconfig  = require('./database');
sql.connect(dbconfig.connection, function(err) {

    if (err){
        throw err ;
    } else{
        console.log('connected');
    }

});

var request = new sql.Request([dbconfig.connection]);


// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        request.query("select * from users where id ="+id, function(err,rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            request.query("SELECT * FROM users WHERE username ='"+username+"'", function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = {
                        username: username,
                        password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                    };

                    request
                    .input('username', sql.VarChar(50), newUserMysql.username)
                    .input('password', sql.VarChar(50), newUserMysql.password)
                    .query('INSERT INTO users (username, password) values (@username, @password); SELECT SCOPE_IDENTITY() AS id;', function(err, rows) {
                        newUserMysql.id = rows[0].id;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            request.query("SELECT * FROM users WHERE username ='"+username+"'", function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                bcrypt.compare('password', rows[0].password, function(err, res) {
                  console.log( res );
                    if( res == null ){
                      return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                    }
                    else
                    {
                      return done(null, rows[0]);
                    }
                });
/*                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password))
                {
                  console.log("+++++++++++++++++++++++++++++++++++++++++++++");
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                }*/

                // all is well, return successful user
                
            });
        })
    );
};
