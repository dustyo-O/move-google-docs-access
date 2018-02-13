modules.define('email-chooser', ['i-bem-dom', 'input'], function (provide, bemDom, Input) {

    provide(bemDom.declBlock(this.name,
        {
            onSetMod: {
                js: {
                    inited: function () {
                        this._input = this.findChildBlock(Input);
                    }
                }
            },

            _chooseEmail: function(e) {
                e.preventDefault();

                this._emit('emailChosen', this._input.getVal());
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._domEvents().on('submit', this.prototype._chooseEmail);
            }
        })
    );
});
