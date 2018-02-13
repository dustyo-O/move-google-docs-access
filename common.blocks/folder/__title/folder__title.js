modules.define('folder__title', ['i-bem-dom', 'button'], function (provide, bemDom, Button) {

    provide(bemDom.declElem('folder', 'title',
        {
            _onClick() {
                this._emit('click');
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._domEvents(Button).on('click', this.prototype._onClick);
            }
        }));

});
