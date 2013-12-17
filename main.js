var express = require('express')
var passport = require('passport')
var util = require('util')
var everyauth = require('everyauth');

var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";

/************** Application Launching ****************/

var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(app.router);
  app.use(everyauth.middleware(app));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

/************** Application Routers ****************/

app.get('/info', function(req,res) {
	res.send('Version 2.1.0');
});

app.get('/openapp', function(req,res) {
	res.send('<script type="text/javascript">window.location = "booltin://?"</script><a href="booltin://?">open</a>');
});

app.get('/login/twitter', function(req,res) {
    everyauth.twitter
        .consumerKey(TWITTER_CONSUMER_KEY)
        .consumerSecret(TWITTER_CONSUMER_KEY)
        .findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
            // find or create user logic goes here
            Console.log('Logged In With Twitter')
        })
        .redirectPath('/');
});

/*************************************/
