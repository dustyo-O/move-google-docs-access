modules.define('auth-button', ['i-bem-dom', 'button'], function (provide, bemDom, Button) {

    provide(bemDom.declBlock(this.name,
        {
            onSetMod: {
                js: {
                    inited: function () {
                        this._button = this.findChildBlock(Button);
                    }
                }
            },

            _initClient: function() {
                var updateSigninStatus = this._updateSigninStatus.bind(this);
                gapi.client.init({
                    apiKey: 'AIzaSyBPW9lfTJN37E8Oiw5Rt3ug4r8_xS6yY38',
                    discoveryDocs: ["https://people.googleapis.com/$discovery/rest?version=v1"],
                    clientId: '647900384433-ofe6abb7rkouaidh6t8mhggji0eg9ork.apps.googleusercontent.com',
                    scope: 'email https://www.googleapis.com/auth/drive'
                }).then(function() {
                    // Handle the initial sign-in state.
                    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                });
            },

            _updateSigninStatus: function(isSignedIn) {
                gapi.auth2.getAuthInstance().signOut()
                    .then(function() {
                        return gapi.auth2.getAuthInstance().signIn({ prompt: 'consent' });
                    })
                    .then(this._makeApiCall.bind(this));
            },

            _makeApiCall: function() {
                var _this = this,
                    btn = this._button,
                    userProfile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile(),
                    user = {
                        id: userProfile.getId(),
                        name: userProfile.getName(),
                        givenName: userProfile.getGivenName(),
                        familyName: userProfile.getFamilyName(),
                        image: userProfile.getImageUrl(),
                        email: userProfile.getEmail()
                    };

                btn.setText(user.name);
                _this._emit('authComplete', user);

            }

        },
        {
            lazyInit: true,

            onInit: function() {
                this._domEvents(Button).on('click', this.prototype._initClient);
            }
        })
    );
});
