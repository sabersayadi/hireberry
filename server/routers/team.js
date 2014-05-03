/**
 * Created by Bijan on 04/29/2014.
 */

// region Team
app.post('/api/team/settings',function(req,res){
    if(!checkUser(req,res))
        return;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newName = req.body.teamName;
    var newAddress=req.body.teamAddress;
    var newTel=req.body.teamTel;
    var newAdmin=req.body.teamAdmin;

    BTeams.update(
        {admin:userID,_id:teamID},
        {name:newName,address:newAddress,tel:newTel,admin:newAdmin},
        function(err,affected) {
            if( err || affected==0 )
                return res.send(401);
            res.send(200);
        })
});

app.get('/api/team/settings',function(req,res){

    if(!checkUser(req,res))
        return;
    var teamID=req.user.teamID;
    BTeams.findOne({_id:teamID})
        .populate('members','_id displayName email')
        .populate('admin','_id displayName email')
        .exec(function(err,team){
            res.send(200,team);
        });

})

app.post('/api/team/name',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newName = req.body.newName;

    BTeams.update({admin:userID,_id:teamID},{name:newName}, function(err,affected) {
        if( err || affected==0 )
            return res.send(401);
        res.send(200);
    })
});

app.post('/api/team/admin',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newAdmin = req.body.newAdmin;

    BTeams.update({admin:userID,_id:teamID},{admin:newAdmin}, function(err,affected) {
        if( err || affected==0 )
            return res.send(401)
        res.send(200);
    })
});

app.post('/api/team/invite', function(req,res){

    if( !checkUser(req,res) )
        return;

    var teamID = req.user.teamID;
    var invitedEmail = req.body.email;

    inviteToTeam( invitedEmail, teamID, function() {
        res.send(200);
    });

});

app.post('/api/team/form/assign', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var formID = req.body.formID;

    // Check whether current user is admin or not
    assignForm(userID, formID, function(err) {
        res.send(200)
    } );

});

app.post('/api/team/form/askForComment', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var formID = req.body.formID;

    // Check whether current user is admin or not
    askForCommentOnForm('',userID, formID, function(err) {
        res.send(200)
    } );

});

app.post('/api/team/application/askForComment', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var applicationID = req.body.applicationID;

    // Check whether current user is admin or not
    askForCommentOnApplication('',userID, applicationID, function(err) {
        res.send(200)
    } );

});

app.get('/api/user/application/askedForComment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;

    getAskedForCommentApplications(userID, function(err,applications) {
        res.send(200,{applications:applications});
    })
});

app.get('/api/user/form/askedForComment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;

    getAskedForCommentForms(userID, function(err,forms) {
        res.send(200,{forms:forms});
    })
});

app.get('/api/application/comments',function(req,res){

    if( !checkUser(req,res) )
        return;

    // ToDo: (Security) Check wheter user can access this applicationID or no.
    var userID = req.user._id;
    var applicationID = req.query.applicationID;

    getComments(applicationID, 'applciation', function(err,comments) {
        res.send(200,{comments:comments});
    })
});

app.get('/api/user/teams', function(req,res) {
    BTeams.find({members:req.user._id}, function(err,teams){
        res.send(200,teams);
    })
});

app.post('/api/user/changeTeam', function(req,res) {
    var userID = req.user._id;
    var teamID = req.body.teamID;

    BUsers.update({_id:userID},{teamID:teamID}, function(err) {
        if(err)
            res.send(307);
        else
            res.send(200);
    });
})

app.get('/api/form/comments',function(req,res){

    if( !checkUser(req,res) )
        return;

    // ToDo: (Security) Check wheter user can access this applicationID or no.
    var userID = req.user._id;
    var formID = req.query.formID;

    getComments(formID, 'form', function(err,comments) {
        res.send(200,{comments:comments});
    })
});

app.post('/api/user/comment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var askForCommentID = req.body.askForCommentID;
    var comment = req.body.comment;

    setComment(userID, askForCommentID, comment, function(err) {
        res.send(200);
    })
});

app.get('/api/team/members',function(req,res){
    if( !checkUser(req,res) )
        return;

    var teamID = req.user.teamID;
    var members = [];

    BTeams.findOne({_id:teamID}).populate('members admin').exec( function(err,team){
        if(err || !team)
            return res.send(305);

        members = team.members.map( function(member) {
            return {
                _id: member._id,
                email: member.email,
                displayName: member.displayName,
                status:'joint',
                role: (member._id.toString()==team.admin._id.toString() ? 'admin' : 'member')
            }
        })

        BInvitations.find({inviterTeam:teamID}, function(err,invitedPersons) {
            if(err)
                return res.send(305);

            for(var i=0; i<invitedPersons.length; i++) {
                members.push({
                    email: invitedPersons[i].invitedEmail,
                    status:'invited',
                    role: 'member'
                });
            }


            res.send(200,{
                teamID: team._id,
                teamName: team.name,
                teamAdminEmail: team.admin.email,
                isAdmin: (team.admin._id.toString()===req.user._id.toString()),
                members: members
            });
        });

    })
});

app.get('/team/:teamID/jobs', function(req,res) {
    res.render('hubpage.ejs',{title:'Hubpage',teamID:req.params.teamID});
})

app.get('/api/team/:teamID/positions',function(req,res){

    var teamID = req.params.teamID;
    var teamName = '';

    BFlyers.find({owner:teamID, publishTime:{$ne:''}})
        .populate('owner')
        .exec(function(err,positions){
            if(err)
                return res.send(305);

            var positionsList = positions.map( function(position) {
                return {
                    id: position._id,
                    title: position.flyer.description
                }
            })

            BTeams.findOne({_id:teamID}, function(err,team){
                res.send(200, {
                    teamName: team.name ,
                    positions: positionsList
                });
            })

        })
});

// endregion
