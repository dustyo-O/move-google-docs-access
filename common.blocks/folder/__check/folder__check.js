modules.define('folder__check', ['i-bem-dom', 'checkbox'], function (provide, bemDom, Checkbox) {

    provide(bemDom.declElem('folder', 'check',
        {
            _onCheck() {
                this._emit('check', this.findChildBlock(Checkbox).hasMod('checked'));
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._domEvents(Checkbox).on('change', this.prototype._onCheck);
            }
        }));

});
