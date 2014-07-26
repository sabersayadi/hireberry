var compression = require('compression')

mandrill = require('mandrill-api/mandrill');
mandrill_client = new mandrill.Mandrill('suHojSqi5KWbijUgT-nzsQ');

Dropbox = require("dropbox"); // https://github.com/evnm/dropbox-node
dbclient = new Dropbox.Client({
    key: "7bdvs2t8zrdqdw8",
    secret: "5y37uqs64t0f3gc",
    sandbox     : false
    //token       : 'tf6jvJZK81wAAAAAAAAAAZiljBK7q8eeXWVAllN7Ipq2dzVdOH89XfcS-xcUZDeA',
    //tokenSecret : '5y37uqs64t0f3gc'
});
dbclient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

var APP_ID = '4Femn58dGqOY09K6Mj7QjlhnqViEquBSRhf9N8LA';
var MASTER_KEY = 'YhTSUbxy54XmnPfE3YqT0vc0tS0FCwO3IYtLPi4r';
Parse = require('parse').Parse;
Parse.initialize(APP_ID,MASTER_KEY);

emailConfig = {
    from: "Hireberry",
    fromAddress: "job@hireberry.com",
    replyAddress: "no-reply@hireberry.com",
    returnBackHost: 'www.hireberry.com'
};

util = require('util');
Promise = require('promise');
engine = require('ejs-locals');
crypto = require('crypto');
fs = require('fs');
http = require('http');
authentication = require('./etc/authentication');
//fileupload = require('./etc/upload');
express = require('express');

app = express();
var cwd=process.cwd();

//region Configure Express
app.configure(function() {
    app.engine('ejs',engine);
    app.set('view engine', 'ejs');
    app.set('views', cwd+ '/views');
    app.use(compression()); // This middleware should be one of the first you "use" to ensure all responses are compressed.
    app.use(express.logger('dev'));
    app.use(express.static(cwd+'/public'));
    app.use(express.logger());
    app.use(express.cookieParser());
//    app.use('/flyer/upload', upload.fileHandler());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'keyboard cat',
        maxAge: false, //1 Hour
        expires: false //1 Hour
    }));
    app.use(everyauth.middleware());
});
//endregion

//region Starting Server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

module.exports = app;
//endregion

models = require('./etc/models');
dashboardRouters = require('./routers/dashboard');
utilitiesRouters = require('./etc/utilities');
billing = require('./routers/billing');
jobRouters = require('./routers/job');
generalRouters = require('./routers/general');
teamRouters = require('./routers/team');
applicationRouters = require('./routers/application');
applicantRelationshipRouters = require('./routers/applicant');


