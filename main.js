var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";
var APP_ID = '5zDqBqs1fKZXlB5LyQf4XAyO8L5IOavBnZ8w03IJ';
var MASTER_KEY = 'qM1rJ9yEksZbNAYbY9CXx5hVlLBYuPU29n8v9vwR';

var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , TwitterStrategy = require('passport-twitter').Strategy;
var twitter = require('ntwitter');
var Parse = require('parse-api').Parse;
var parseApp = new Parse(APP_ID, MASTER_KEY);
var app = express();


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://booltin.heroku.com/auth/twitter/callback",
    passReqToCallback: true
  },
  function(req, token, tokenSecret, profile, done) {
  	parseApp.insert('twitter', {
        uid: req.cookies.uid,
        accessToken: token,
        accessTokenSecret: tokenSecret
        }, function (err, response) {
  		    console.log(response);
	    });
    return done(null, profile);
  }));

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Start server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

/*** Routers ***/

app.get('/info', function(req,res) {
    res.send('Version 2.0.0');
});

app.get('/openapp', function(req,res) {
    res.send('<script type="text/javascript">window.location = "booltin://?"</script><a href="booltin://?">open</a>');
});

/*
app.get('/auth/twitter/:uid', passport.authenticate('twitter'), function(req, res){
    res.send( req.params.uid + '...' + req.user.username + '...');
});
*/

app.get('/auth/twitter/user/:uid', function(req, res, next) {

    res.cookie('uid',req.params.uid);

    passport.authenticate('twitter', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login'); }
        else { res.send( req.param('uid') + '...' + user.username + '...'); }
    })(req, res, next);
});

app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/auth/twitter'
}));

app.get('tweet/:uid/:message', function(req,res) {
    var msg = req.params['message'];
    var uid = req.params['uid'];

    parseApp.find('Foo', { uid:req.params['uid'] } , function (err, response) {
        console.log('>>>>>>>>>>>>>' + response );
        var twit = new twitter({
                consumer_key: TWITTER_CONSUMER_KEY,
                consumer_secret: TWITTER_CONSUMER_SECRET,
                access_token_key: response.accessToken,
                access_token_secret: response.accessTokenSecret
        });

        twit.verifyCredentials(function (err, data) {
            if (err) {
                cb("Error verifying credentials: " + err);
            } else {
                twit.updateStatus('TEST from my new app', function (err, data) {
                    if (err) {
                        cb('Tweeting failed: ' + err);
                    } else {
                        cb('Success!')
                    }
                });
            }
        });
    });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
