/**
 * Created by Bijan on 04/29/2014.
 */
crypto = require('crypto');
everyauth = require('everyauth');
twitterAPI = require('node-twitter-api');
linkedin_client = require('linkedin-js')('75ybminxyl9mnq', 'KsgqEUNsLSXMAKg6', 'callbackURL')

everyauth.debug = true;

//region Initialization
var LINKEDIN_CONSUMER_KEY = "77pqtwladavveq";
var LINKEDIN_CONSUMER_SECRET = "OtnTkyKjGB6gY2J5";
var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";
var GOOGLE_CLIENT_ID = '892388590141-l0qsh6reni9i0k3007dl7q4340l7nkos.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'YzysmahL5LX4GLIydqBXN1zz';
var Facebook_AppID='241341676042668';
var Facebook_AppSecret='2e748d80c87a8594e792eeb482f7c87d';


var keySize=512;
var hashIteration=1;


TwitterAccessToken = '267915249-EKZZ2KneSOf06oIOMXFKWoSEsXQTg3EwjH4Z4dU1';
TwitterAccessTokenSecret = 'ReF8CIy5IdFCmasTlKaayYAoSEIzYL4b4VLcp8IwBLVMD';
twitter = new twitterAPI({
    consumerKey: 'Lw7YsCYUV2Dv9yYViTvPQ',
    consumerSecret: '1MUO7r44h230yRcASFNzSVlBlssvSSEqnarWpztbfw',
    callback: 'http://localhost:5000/'
});

/*
About PromoCode:
PromoCode must be sent by query string in login or register, like these:
    /register?code=XXX
    /login?code=XXX

In register page, promoCode will be validate and then saved in cookie.
If it isn't valid, page will be redirected to '/'.

In login page, promoCode will be saved in cookie and just if user use 'Login with linkedIn'
and it was the first time that user is logging in (user must be created in database), then
promoCode will be validate and use.

So:

-Register page
    --Have PromoCode (validate promoCode and save in cookie)
        ---Register with password (use PromoCode)
        ---Register with linkedIn (validate and use PromoCode)
    --Not have PromoCode

-Login page (save PromoCode)
    --Have PromoCode ()
    --Not have PromoCode ()
 */

//region Configure every modules in everyauth
everyauth.everymodule
    .findUserById( function (id, callback) {
        BUsers.findOne({_id:id}, function(err,user) {
            callback(null, user);
        });
    });
//endregion

everyauth.everymodule.handleLogout(function (req, res) {
    if(req.cookies['bltn.session.login'])
    {
        res.clearCookie('bltn.session.login');
    }
    if(req.cookies['bltn.persistent.login'])
    {
        var cookieContent=req.cookies['bltn.persistent.login'].split('&');
        BPersistLogin.remove({username : cookieContent[0], token: cookieContent[1]}, function (err, user) {

            if(err)
                console.log(err);
            else
                console.log(">>>>>>>> The cookie info has removed from database.")
        });
        res.clearCookie('bltn.persistent.login');
    }

    req.logout();
    everyauth.everymodule.redirect(res, everyauth.everymodule.logoutRedirectPath());;
});

//region LinkedIn Authentication Configuration
everyauth.linkedin
    .consumerKey(LINKEDIN_CONSUMER_KEY)
    .consumerSecret(LINKEDIN_CONSUMER_SECRET)
    .moduleTimeout(60000)
    .fetchOAuthUser(function (accessToken, accessTokenSecret, params) { // This method is override because we need to get extra info from user profile
        var promise = this.Promise();
        this.oauth.get(this.apiHost() + '/people/~:(id,first-name,last-name,emailAddress,headline,location:(name,country:(code)),industry,num-connections,num-connections-capped,summary,specialties,proposal-comments,associations,honors,interests,positions,publications,patents,languages,skills,certifications,educations,three-current-positions,three-past-positions,num-recommenders,recommendations-received,phone-numbers,im-accounts,twitter-accounts,date-of-birth,main-address,member-url-resources,picture-url,site-standard-profile-request:(url),api-standard-profile-request:(url,headers),public-profile-url)', accessToken, accessTokenSecret, function (err, data, res) {
            if (err) {
                err.extra = {data: data, res: res}
                return promise.fail(err);
            }
            var oauthUser = JSON.parse(data);
            promise.fulfill(oauthUser);
        });
        return promise;
    })
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, linkedinUserMetadata) {
        // find or create user logic goes here
        var promise = this.Promise();

        BUsers.findOne({linkedinid:linkedinUserMetadata.id}, function(err,user){

            if(err)
                return promise.fail([err]);

            if(!user){

                // PromoCode
                var code = session.req.cookies['promocode'];

                checkPromoCode(code, function(err,promoCode){
                    if( publicRegisterIsAllowed() == false && err )
                        return promise.fail(err.error);
                    else if(publicRegisterIsAllowed() == false && promoCode.permissionForRegister==true)
                        createNewUser();
                    else if(publicRegisterIsAllowed() == true)
                        createNewUser();
                });


                function createNewUser() {
                    var newUser = BUsers({
                    email: linkedinUserMetadata.emailAddress,
                    displayName: linkedinUserMetadata.firstName + ' ' + linkedinUserMetadata.lastName,
                    linkedinname:linkedinUserMetadata.lastName,
                    linkedinid:linkedinUserMetadata.id,
                    linkedinAccessToken:accessToken,
                    linkedinAccessSecretToken:accessTokenSecret
                });
                    newUser.save(function(err){
                    if(err)
                        promise.fail([err]);
                    else
                        gettingReady( newUser._id, session.req.cookies['promocode'], function() {
                            promise.fulfill(newUser);
                        });

                });
                }
            } else {
                promise.fulfill(user);
            }
        });

        return promise;
    })
    .redirectPath('/');
//endregion

//region Local Username/Password Registration and Authentication Configuration
everyauth.password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.ejs')
    .loginLocals( function (req, res, done) {

        if( req.user )
            return res.redirect('/');

        res.cookie('promocode',req.query.code);
        setTimeout( function () { done(null, { title: 'Login'}); }, 200);
    })
    .respondToLoginSucceed( function (res, user) {
        if (user)
        {
            if(!res.req.cookies['bltn.persistent.login'] && res.req.body['RememberMe']=='on')
            {
                // ToDo: Check this section again. I don't believe it !

                //create token and save it in cookie;
                var token = crypto.randomBytes(128).toString('base64');

                var currentDate=new Date();
                var lastRequestDate=new Date();
                lastRequestDate.setMonth(lastRequestDate.getMonth()+24);
                BPersistLogin(
                    {
                        username: user._doc.email,
                        expireDate:lastRequestDate.toString(),
                        lastRequestDate: currentDate.toString(),
                        token:token
                    }).save(function(err,user){
                        //gettingReady( user._id, function() {
                        //    console.log(user);
                        //});
                    });
                res.setHeader('Set-Cookie', 'bltn.persistent.login='+user._doc.email+"&"+token+'; expires='+lastRequestDate.toString());
            }
            res.json({
                success: true,
                lastPage: res.req.session.lastPage || '/'
            }, 200);
        }
        else
            res.json({ success: false }, 501);
    })
    .respondToLoginFail( function (req, res, errors, login) {
        if (errors && errors.length)
            res.json({ success: false, errors: errors });
    })
    .authenticate( function (login, password,data) {

        var promise = this.Promise();

        /*var persitCookie= data.req.cookies['bltn.persistent.login'];
        //#################################################################
        var sessionCookie= data.req.cookies['bltn.session.login'];
        if(sessionCookie)
        {
            var cookieContent=sessionCookie.split('&');
            login=cookieContent[0];
            var token=cookieContent[1];
            BUsers.findOne({ email: login}, function (err, user) {
                if (err)
                    return promise.fulfill([err]);

                console.log(user);

                if (!user)
                {
                    data.res.clearCookie('bltn.session.login');
                    return promise.fulfill(['invalid user']);
                }

                if(!user.password || !user.salt)
                {
                    data.res.clearCookie('bltn.session.login');
                    return promise.fulfill(['Server authentication error.']);
                }
                var password_token = user.password.toString('base64');

                var eq=true;
                var password_token =user.password.toString('base64');
                if(token!==password_token)
                    eq=false;
                if(!eq)
                {
                    data.res.clearCookie('bltn.persistent.login');
                    promise.fulfill(['Invalid password']);
                }
                else
                    promise.fulfill(user);
            });
        }
        //#################################################################
        else if( data.req.body['LoadingTime']=='1'  && persitCookie)
        {
            //check user & token;
            var cookieContent=persitCookie.split('&');
            login=cookieContent[0];
            BPersistLogin.findOne({ token: cookieContent[1]}, function (err, user) {
                if (err)
                {
                    data.res.clearCookie('bltn.persistent.login');
                    return err;
                }
                else if(!user)
                {
                    data.res.clearCookie('bltn.persistent.login');
                    return promise.fulfill(['Invalid  token']);
                }
                else
                {
                    var exipreDate=new Date(user.expireDate);
                    if(exipreDate && exipreDate<new Date())
                    {
                        //If expire date is invalid remove info from database and clear cookie
                        var cookieContent=data.req.cookies['bltn.persistent.login'].split('&');
                        BPersistLogin.remove({username : cookieContent[0], token: cookieContent[1]}, function (err, user) {

                            if(err)
                                console.log(err);
                            else
                                console.log(">>>>>>>> The cookie info has removed from database.")
                        });
                        data.res.clearCookie('bltn.persistent.login');

                        return promise.fulfill(['The login date has expired']);
                    }
                }
                //========================================================
                var errors = [];
                if (!login)
                    errors.push('Missing login');
                //if (!password)
                //errors.push('Missing password');
                if (errors.length)
                    return errors;

                //var promise = everyauth.password..Promise();
                BUsers.findOne({ email: login}, function (err, user) {
                    if (err)
                        return promise.fulfill([err]);

                    console.log(user);

                    if (!user)
                        return promise.fulfill(['invalid user']);
                    if(!user.password || !user.salt)
                        return promise.fulfill(['Server authentication error.']);

                    promise.fulfill(user);
                });
            });
        }
        else{*/
            var errors = [];
            if (!login)
                errors.push('Missing login');
            if (!password)
                errors.push('Missing password');
            if (errors.length)
                return errors;

            // var promise = everyauth.password.Promise();
            BUsers.findOne({ email: login}, function (err, user) {
                if (err)
                    return promise.fulfill([err]);

                console.log(user);

                if (!user)
                    return promise.fulfill(['invalid user']);
                if(!user.password || !user.salt)
                    return promise.fulfill(['Server authentication error.']);

                crypto.pbkdf2( password, user.salt, hashIteration, keySize,
                    function(err, dk) {
                        var eq=true;
                        var key=user.password;
                        for(var i=0;i<keySize;i++) eq &= key[i] == dk[i];
                        if(!eq)
                            promise.fulfill(['Invalid password']);
                        else
                        {
                            if(data.req.cookies['bltn.session.login'])
                                data.res.clearCookie('bltn.session.login');
                            data.res.setHeader('Set-Cookie', 'bltn.session.login='+user._doc.email+"&"+user.password.toString('base64'));
                            promise.fulfill(user);
                        }

                    }
                );
            });
        //}//end else
        return promise;
    })
    .loginSuccessRedirect(function(req,res){
        return res.req.session.lastPage || '/dashboard';
    })
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.ejs')
    .registerLocals( function (req, res, done) {

        if( req.user  )
            return res.redirect('/');

        //addPromoCode('test',60,20,true,function(){});
        var code = req.query.code;

        if( publicRegisterIsAllowed() == false && !code)  // Register just with code is allowed
            return res.redirect('/?error=regCode');

        checkPromoCode(code, function(err,promoCode){
            if( publicRegisterIsAllowed() == false && err )
                return res.redirect('/?error=regCode');
            else if( publicRegisterIsAllowed() || ( !publicRegisterIsAllowed() && promoCode.permissionForRegister) ) {
                setTimeout( function () {
                    res.cookie('promocode',code);
                    done(null, { title: 'Register'});
                }, 200);
            }
        });
    })
    .validateRegistration( function (newUserAttributes) {
        return null;
    })
    .registerUser( function (newUserAttributes,extra) {
        var promise = this.Promise(),
            password=newUserAttributes.password;

        delete newUserAttributes[password]; // Don't store password
//        newUserAttributes.salt = bcrypt.genSaltSync(10);
//        newUserAttributes.hash = bcrypt.hashSync(password, newUserAttributes.salt);
//

        BUsers.count({email:newUserAttributes.email}, function(err,count){
            if(count>0)
                return promise.fail(['This email address has already registered']);
            else{
                var salt = crypto.randomBytes(128).toString('base64');

                crypto.pbkdf2( password, salt, hashIteration, keySize,
                    function(err, dk) {
                        BUsers(
                            {
                                email: newUserAttributes.email,
                                displayName: newUserAttributes.email.split('@')[0],
                                password: dk,
                                salt:salt
                            }).save(function(err,user){
                                gettingReady( user._id, extra.req.cookies['promocode'], function() {
                                    promise.fulfill(user);
                                });
                            });
                    }
                );


            }
        });

        return promise;
    })
    .registerSuccessRedirect('/');
//endregion

