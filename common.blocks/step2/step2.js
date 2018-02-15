modules.define('step2', ['i-bem-dom', 'folder', 'button', 'BEMHTML'],
function (provide, bemDom, Folder, Button, BEMHTML) {
    provide(bemDom.declBlock(this.name,
        {
            onSetMod: {
                run: function() {
                    this._path = [];
                    this._checked = [];
                    this.setMod('visible');

                    this._retrievePage('root');

                    this._events(Folder).on('openFolder', this._onOpenFolder);
                    this._events(Folder).on('checkFolder', this._onCheckFolder);

                    this._events(Button).on('click', this._onContinueClick);

                }
            },

            _onOpenFolder: function(e, data) {
                if (e.target.hasMod('parent')) {
                    this._path.pop();
                    this._retrievePage(this._path.pop())
                } else {
                    this._retrievePage(data.id);
                }
            },

            _onCheckFolder: function (e, data) {
                if (data.check) {
                    this._checked.push(data);
                } else {
                    this._checked = this._checked.reduce(function(checked, elem) {
                        if (elem.id !== data.id) checked.push(elem);

                        return checked;
                    }, []);
                }
            },

            _onContinueClick: function() {
                this._emit('gotFolders', this._checked);
            },

            _retrievePage: function(folderId, request, result) {
                if (!folderId) folderId = 'root';
                var params = {
                    'q': "mimeType='application/vnd.google-apps.folder' and '" + folderId +
                        "' in parents and trashed = false"
                };

                if (!request) {
                    return this._retrievePage(folderId, gapi.client.drive.files.list(params), []);
                }

                var _this = this;
                request.execute(function(resp) {
                    result = result.concat(resp.items);
                    var nextPageToken = resp.nextPageToken;
                    if (nextPageToken) {
                        params.pageToken = nextPageToken;
                        request = gapi.client.drive.files.list(params);
                        _this._retrievePage(folderId, request, result);
                    } else {
                        _this._refreshPage(folderId, result);
                    }
                });
            },

            _refreshPage: function(currentFolder, result) {
                if (Array.isArray(result)) {
                    var _this = this,
                        folders = (this._path.length > 0 ? [{
                            block: 'folder',
                            mods: { parent: true },
                            title: '..',
                            checked: false // TODO
                        }] : []).concat(
                            result.map(function(folder) {
                                console.log(_this._checked.indexOf(folder.id) !== -1);
                                return {
                                    block: 'folder',
                                    id: folder.id,
                                    title: folder.title,
                                    icon: folder.iconLink,
                                    checked: _this._checked.some(function(elem) {
                                        return elem.id === folder.id
                                    })
                                };
                            })
                        );

                    this._path.push(currentFolder);

                    bemDom.update(this._elem('folders').domElem, BEMHTML.apply(folders));
                }
            }
        },
        {
            lazyInit: true
        })
    );
});
