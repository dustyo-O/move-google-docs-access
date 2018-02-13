modules.define('step0', ['i-bem-dom', 'auth-button', 'email-chooser'], function (provide, bemDom, AuthButton, EmailChooser) {

    provide(bemDom.declBlock(this.name,
        {
            _onAuth(e, data) {
                this._emit('gotUserInfo', data);
            },

            _onEmail(e, data) {
                this._emit('gotUserInfo', {
                    email: data
                });
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._events(AuthButton).on('authComplete', this.prototype._onAuth);
                this._events(EmailChooser).on('emailChosen', this.prototype._onEmail);
            }
        }));

});
