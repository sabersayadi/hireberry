/**
 * Created by coybit on 3/16/14.
 */

module.exports.showDashboard = function (req,res) {
    res.render('dashboard.ejs');
}

module.exports.forms = function (req,res) {
    var submittedForms = {
        cols: {
            userId: { index: 1, type: "number", unique:true },
            applyTime: { index: 2, type: "string" },
            name: { index: 3, type: "string" },
            email: { index: 4, type: "string" },
            skills: { index: 5, type: "string"},
            profiles: { index: 6, type: "string"},
            workTime: { index: 7, type: "string" },
            workPlace: { index: 8, type: "string" },
            resumePath: { index: 9, type: "string" },
            anythingelse: { index: 10, type: "string" }
        },
        rows: []
    };

    MApplyForm.find( {}, function(err,forms) {
        if( err )
            return res.send(303,{error:err});

        for( var i=0; i<forms.length; i++ ) {
            var form = forms[i]._doc;

            // userId
            form.userId = i+1;
            form.checked = false;

            // Skills
            var skills = JSON.parse( form.skills );
            var selectedSkill = '';
            for (var skill in skills)
                if ( skills.hasOwnProperty(skill) && skills[skill]==='on' )
                    selectedSkill += '<span class="spanBox">' + skill + '</span>';
            form.skills = selectedSkill;

            // Profiles
            form.profiles = form.profiles || '{}';
            var profiles = JSON.parse( form.profiles );
            var selectedProfiles = '';
            for (var profile in profiles)
                if ( profiles.hasOwnProperty(profile) && profiles[profile]!=='' )
                    selectedProfiles +=
                        '<span class="spanBox">' +
                        makeLinkTag(profile,profiles[profile],false) +
                        '</span>';
            form.profiles = selectedProfiles;

            // Workplace
            //form.workPlace = (form.workPlace=='fulltime') ?

            // Email
            form.email = makeLinkTag( form.email, form.email, true );

            // Apply Date
            var date = new Date( form.applyTime );
            form.applyTime = date.toLocaleDateString();

            // Resume
            form.resumePath = (form.resumePath==='-') ? '' : makeLinkTag( 'link', form.resumePath, false);

            submittedForms.rows.push( form );
        }

        res.send(submittedForms);
    })
}

function makeLinkTag(display, url, mailto) {
    return '<a href="'+ (mailto?'mailto:':'') + url + '">' + display + '</a>';
}