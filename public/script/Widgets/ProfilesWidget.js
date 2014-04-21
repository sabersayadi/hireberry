function ProfilesWidget() {
    Widget.call(this);

    var profile = '';

    function initLayout() {
        profile = this.clone('.profilesWidget');
    }

    initLayout.call(this);
    this.setLayout(profile);

    this.widgetDidAdd = function () {
        this.setToolbar('.toolbar-profileWidget');
        var fileInput = this.portlet.find('input[type=file]');
        var avatar = this.portlet.find('.bool-avatar-image');
        profile.find('.bool-avatar-menu-gravatar').click(
            function(){findGravatar(profile, profile.find('input[name="email"]').val())});

        profile.find('.bool-avatar-menu-upload').click(
            function(){
                fileInput.click();
            }
        );
        profile.find('.bool-avatar-menu-remove').click(function(){
            profile.find('.bool-avatar-no-container').show();
            profile.find('.bool-avatar-image').hide();
        });
        if (!this.editMode==false) {
            fileInput.fileupload({
                url: '/flyer/upload',
                dataType: 'json',
                replaceFileInput: false,
//                add:add,
                dropZone: avatar,
//                send:send,
                done: done,
//                progressall:progressall
                x: 'x'
            });

        }
        else {
//            this.portlet.find('input').not('input[name=personalInfo-item]').prop('readOnly','readOnly').css('cursor','default');
        }
    }

    function done(e, data) {
        var avatar=profile.find('.bool-avatar-image');
        profile.find('.bool-avatar-no-container').hide();
        avatar.show();
        avatar.attr('src', "/uploads/" + data.result.files[0].name);

    }

    profile.find('input[type=button]').each(function (i, input) {
        $(input).click(function () {
            $(input).next().val("");
        });
    });

    this.toolbar.delegate('input[name=p]','change',function () {
        profile.find('[for^="' + this.value+'"]').parent().css('display', this.checked ? '' : 'none');
    });
    profile.delegate('[name=email]','blur',function(){
       fillProfiles.call(profile);
    });

     this.toolbar.find('.bool-btn').each(function (i, btn) {
        $(btn).click(function () {
            var input = $(btn).find('input[name=p]');
            input.prop('checked', !input.is(':checked')).trigger('change');
        });
    });
    this.portlet.delegate('.bool-clear-btn', 'click', function () {
        $(this).parent().parent().find('input').val('');
    })


    this.serialize = function () {

        var data = {
            profiles: this.toolbar
                .find('.toolbar-profileWidget input').serialize().replace(/p=/gi, '').split('&')};

        return data;
    }

    this.deserialize = function (data) {
        this.toolbar.find('input[name=p]').each(
            function (i, input) {
                $(input).prop('checked', data.profiles.indexOf(input.value) >= 0).change();
            }
        );
    }
}
ProfilesWidget.prototype=new Widget();
ProfilesWidget.prototype.constructor=ProfilesWidget;
ProfilesWidget.instances = 1;