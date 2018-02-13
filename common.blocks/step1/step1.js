modules.define('step1', ['i-bem-dom', 'auth-button'], function (provide, bemDom, AuthButton) {

    provide(bemDom.declBlock(this.name,
        {
            _onAuth(e, data) {
                this._emit('gotUserInfo', data);
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._events(AuthButton).on('authComplete', this.prototype._onAuth);
            }
        }));

});
