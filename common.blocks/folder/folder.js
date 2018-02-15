modules.define('folder', ['i-bem-dom', 'folder__check', 'folder__title'],
function (provide, bemDom, FolderCheck, FolderTitle) {

    provide(bemDom.declBlock(this.name,
        {
            _onTitleClick: function() {
                this._emit('openFolder', { id: this.params.id });
            },

            _onCheck: function(e, data) {
                console.log(this.params);
                this._emit('checkFolder', {
                    id: this.params.id,
                    iconLink: this.params.iconLink,
                    title: this.params.title,
                    check: data
                });
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
