modules.define('folder', ['i-bem-dom', 'folder__check', 'folder__title'],
function (provide, bemDom, FolderCheck, FolderTitle) {

    provide(bemDom.declBlock(this.name,
        {
            _onTitleClick: function() {
                this._emit('openFolder', { id: this.params.id });
            },

            _onCheck: function(e, data) {
                this._emit('checkFolder', { id: this.params.id, check: data })
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._events(FolderTitle).on('click', this.prototype._onTitleClick);
                this._events(FolderCheck).on('check', this.prototype._onCheck);
            }
        })
    );
});
