var express = require('express')
var passport = require('passport')
var util = require('util')
var everyauth = require('everyauth');
var mongoose =  require('mongoose');
var Promise = require('promise');

/*
    /auth/twitter
    /auth/google
    /logout
    /register
    /login
 */

/************** Initialization ****************/

var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";
var GOOGLE_CLIENT_ID = '105806305660-2k8f0sr0mg8a36rn8fmn0fsh9ls85iio.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'uFr61pADo3O5b1uyaEk5Cmuh';
var mongoHQConenctionString = 'mongodb://admin:admin124578@dharma.mongohq.com:10064/booltindb';

var app = express();
mongoose.connect(mongoHQConenctionString);

var BUsers = mongoose.model( 'users', {email: String, password: String, salt: String} );

everyauth.everymodule
    .findUserById( function (id, callback) {
        callback(null, usersById[id]);
    });

everyauth.twitter
    .consumerKey(TWITTER_CONSUMER_KEY)
    .consumerSecret(TWITTER_CONSUMER_SECRET)
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
        // find or create user logic goes here
        Console.log('Logged In With Twitter')
    })
    .redirectPath('/');

everyauth.google
    .appId(GOOGLE_CLIENT_ID)
    .appSecret(GOOGLE_CLIENT_SECRET)
    .scope('https://www.google.com/m8/feeds') // What you want access to
    .handleAuthCallbackError( function (req, res) {
        // If a user denies your app, Google will redirect the user to
        // /auth/facebook/callback?error=access_denied
        // This configurable route handler defines how you want to respond to
        // that.
        // If you do not configure this, everyauth renders a default fallback
        // view notifying the user that their authentication failed and why.
    })
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
        // find or create user logic goes here
        // Return a user or Promise that promises a user
        // Promises are created via
        //     var promise = this.Promise();
    })
    .redirectPath('/');

everyauth.password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.jade')
    .loginLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Async login'
            });
        }, 200);
    })
    .authenticate( function (login, password) {
        var errors = [];
        if (!login)
            errors.push('Missing login');
        if (!password)
            errors.push('Missing password');
        if (errors.length)
            return errors;

        var promise = this.Promise()
        BUsers.findOne({ email: login}, function (err, user) {
          if (err)
              return promise.fulfill([err]);

            console.log(user);

            if (!user)
                return ['Login failed'];
            if (user.password !== password)
                return ['Login failed'];

          promise.fulfill(user);
        });
       return promise;
    })
    .loginSuccessRedirect('/')

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.jade')
    .registerLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Async Register'
            });
        }, 200);
    })
    .validateRegistration( function (newUserAttributes) {
        return null;
    })
    .registerUser( function (newUserAttributes) {/*
        var user = BUsers({email: newUserAttributes.email, password: newUserAttributes.password, salt: ''});
        user.save();
        return user;*/
    })
    .registerSuccessRedirect('/');

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.static(process.cwd() + '/public'));
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(everyauth.middleware());
});

/************** Starting Server ****************/

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

module.exports = app;

/************** Application Routers ****************/

app.get('/info', function(req,res) {
	res.send('Version 2.1.0');
});

app.get('/openapp', function(req,res) {
	res.send('<script type="text/javascript">window.location = "booltin://?"</script><a href="booltin://?">open</a>');
});

app.get('/email/register', function(req,res) {
   res.render('register');
});

app.get('/email/login', function(req,res) {
    res.render('login');
});

/*************************************/
