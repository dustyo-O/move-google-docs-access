modules.define('step3', ['i-bem-dom', 'spin'], function (provide, bemDom, Spin) {
    provide(bemDom.declBlock(this.name,
        {
            run(data) {
                var _this = this;
                function loopFolders(i, folders, onFinish) {
                    console.log('LOOPFOLDERS ' + i);
                    if (i < folders.length) {
                        var folder = folders[i];
                        _this._logAction('current', folder);
                        _this._retrievePage(folder.id, null, null, function () {
                            _this._logAction('exit');
                            //_this._logAction('log', 'Жду одну секунду, чтобы не упереться в лимит операций...');
                            setTimeout(function() {
                                loopFolders(i + 1, folders, onFinish);
                            }, 1000);
                        });
                    } else {
                        onFinish();
                    }
                }

                this.setMod('visible');

                this._filesProcessed = 0;
                this._filesLimit = Infinity;
                this._foldersProcessed = 0;
                this._foldersLimit = Infinity;
                this._foldersDone = [];
                this._filesDone = [];
                this._path = [];

                this._fromUser = data.fromUser;
                this._toUser = data.toUser;

                loopFolders(0, data.folders, function() {
                    _this._logAction('log', 'Готово!');
                    _this.findChildBlock(Spin).delMod('visible');
                })
            },

            _retrievePage: function (folderId, request, result, cb) {
                var params = {
                    'q': "'" + folderId + "' in parents and trashed = false"
                };

                if (!request) {
                    return this._retrievePage(folderId, gapi.client.drive.files.list(params), [], cb);
                }

                if (!this._foldersLimit || this._foldersLimit > Infinity) return;
                if (!this._filesLimit || this._filesLimit > Infinity) return;

                var _this = this;
                request.execute(function(resp) {
                    result = result.concat(resp.items);
                    var nextPageToken = resp.nextPageToken;
                    if (nextPageToken) {
                        params.pageToken = nextPageToken;
                        request = gapi.client.drive.files.list(params);
                        _this._retrievePage(folderId, request, result, cb);
                    } else {
                        setTimeout(function() {
                            _this._processResult(result, cb);
                        }, 1000);
                    }
                });
            },

            _processResult: function(result, cb) {
                console.log('_processResult');
                var _this = this;

                if (!this._foldersLimit || this._foldersLimit > 10) return;
                if (!this._filesLimit || this._filesLimit > 10) return;

                function loopResult(i, result, onFinish) {
                    console.log('LOOPRESULT ' + i);
                    if (i < result.length) {
                        var file = result[i];

                        if (!file ||
                            (_this._filesDone.indexOf(file.id) !== -1) ||
                            (_this._foldersDone.indexOf(file.id) !== -1))
                        {
                            _this._logAction('log', ' Нет информации/уже обработанный файл, пропускаю...');
                            //_this._logAction('log', ' Жду одну секунду, чтобы не упереться в лимит операций...');

                            setTimeout(function () {
                                loopResult(i + 1, result, onFinish);
                            }, 100);
                        } else {
                            //_this._logAction('found', file);

                            _this._getFileOwner(file, function(owner) {
                                console.log('OWNER ', owner);
                                if (owner.emailAddress === _this._fromUser.email) {
                                    var process;

                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        process = _this._processFolder.bind(_this);
                                    } else {
                                        process = _this._processFile.bind(_this);
                                    }

                                    process(file, function() {
                                        //_this._logAction('log', ' Жду одну секунду, чтобы не упереться в лимит операций...');

                                        setTimeout(function() {
                                            console.log(i + 1);
                                            loopResult(i + 1, result, onFinish);
                                        }, 100);
                                    });
                                } else {
                                    if (!owner.emailAddress) {
                                        _this._logAction('log', ' ВНИМАНИЕ! Нет информации о владельце файла! ' + file.title);
                                    } else {
                                        _this._logAction('log', ' Владелец файла ' + file.title + ' - другой пользователь ');
                                    }

                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        _this._retrievePage(file.id, null, null, function() {
                                            setTimeout(function () {
                                                loopResult(i + 1, result, onFinish);
                                            }, 100);
                                        });
                                    } else {
                                        setTimeout(function () {
                                            loopResult(i + 1, result, onFinish);
                                        }, 100);
                                    }
                                    //_this._logAction('log', ' Жду одну секунду, чтобы не упереться в лимит операций...');
                                }
                            });

                        }
                    } else {
                        onFinish();
                    }
                }
                //_this._logAction('log', 'Жду одну секунду, чтобы не упереться в лимит операций...');

                setTimeout(function () {
                    loopResult(0, result, cb);
                }, 1000);

            },

            _processFolder(folder, cb) {
                var _this = this;
                this._logAction('current', folder);

                this._logAction('log', 'Folder: ' + folder.title);
                if (this._foldersDone.indexOf(folder.id) !== -1) {
                    this._logAction('log', ' Папка: ' + folder.title + '  уже была обработана');
                    cb();
                } else {
                    this._foldersDone.push(folder.id);

                    if (this._foldersProcessed < this._foldersLimit) {
                        this._foldersProcessed++;

                        this._copyFolderWithPermissions(folder, function() {
                            _this._retrievePage(folder.id, null, null, function () {
                                _this._logAction('exit');
                                cb();
                            });
                        });
                    } else {
                        this._logAction('log', 'Не обрабатываю - лимит операций');
                        this._retrievePage(folder.id, null, null, function() {
                            _this._logAction('exit');
                            cb();
                        });
                    }
                }

            },

            _processFile(file, cb) {
                var _this = this;
                this._logAction('current', file);

                this._logAction('log', 'File: ' + file.title);

                if (this._filesDone.indexOf(file.id) !== -1) {
                    this._logAction('log', ' Файл: ' + file.title + ' уже был обработан');
                    cb();
                } else {
                    if (file.title.indexOf('OLD -') === -10) {
                        this._logAction('log', ' Это старый файл, пропускаю');

                        this._logAction('exit');
                        cb();
                    } else {
                        if (this._filesProcessed < this._filesLimit) {
                            this._filesProcessed++;
                            this._filesDone.push(file.id);
                            this._copyFileWithPermissions(file, function () {
                                _this._logAction('exit');
                                cb();
                            });
                        } else {
                            this._logAction('log', 'Не обрабатываю - лимит операций');
                            this._logAction('exit');
                            cb();
                        }
                    }
                }
            },

            _getFileOwner(file, cb) {
                this._logAction('log', ' Определяю владельца: ' + file.title);

                if (file.owners && file.owners.length) {
                    cb(file.owners.pop());
                } else {
                    this._getFilePermissions(file, function (permissions) {
                        var owner = {};
                        permissions.forEach(function (permission) {
                            if (permission.role === 'owner') owner.emailAddress = permission.emailAddress;
                        });

                        cb(owner);
                    });

                }
            },

            _getFilePermissions(file, cb) {
                var _this = this;
                var request = gapi.client.drive.permissions.list({
                    'fileId': file.id,
                    'resource': {}
                });

                request.execute(function (resp) {
                    if (resp.code) {
                        _this._logAction('log', ' Ошибка!!! ' + resp.message);
                        cb([]);
                        return;
                    }

                    cb(resp.items);
                });

            },

            _copyFolderWithPermissions(folder, cb) {
                var _this = this;
                var body = {
                    'title': folder.title,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': folder.parents
                };
                var request = gapi.client.drive.files.insert({
                    'resource': body
                });

                request.execute(function (newFolder) {
                    if (newFolder.code) {
                        _this._logAction('log', ' Ошибка!!! ' + newFolder.message);
                        cb();
                        return;
                    }

                    _this._logAction('log', ' Сделана копия папки: ' + newFolder.title);

                    var body = { 'title': 'OLD - ' + folder.title };
                    var request = gapi.client.drive.files.patch({
                        'fileId': folder.id,
                        'resource': body
                    });

                    request.execute(function (resp) {
                        if (resp.code) {
                            _this._logAction('log', ' Ошибка при переименовании!!! ' + resp.message);
                        }

                        _this._getFilePermissions(folder, function (perms) {
                            function moveChildren() {
                                _this._retrievePage(folder.id, null, null, function (children) {
                                    function loopChildren(i, children, onFinish) {
                                        if (i < children.length) {
                                            var child = children[i];
                                            var body = { 'id': newFolder.id };
                                            var request = gapi.client.drive.parents.insert({
                                                'fileId': child.id,
                                                'resource': body
                                            });
                                            request.execute(function (resp) {
                                                if (newFolder.code) {
                                                    _this._logAction('log', ' Ошибка!!! ' + newFolder.message);
                                                }

                                                //_this._logAction('log', ' Жду одну секунду, чтобы не упереться в лимит операций...');
                                                setTimeout(function () {
                                                    loopChildren(i + 1, children, onFinish);
                                                }, 1000);
                                            });
                                        } else {
                                            onFinish();
                                        }
                                    }

                                    if (children && children.length) {
                                        _this._logAction('log', ' Переношу детей для папки ' + newFolder.title);
                                        loopChildren(0, children, cb);
                                    } else {
                                        _this._logAction('log', ' Нет детей у папки ' + newFolder.title);
                                        cb();
                                    }
                                });
                            }

                            if (perms) {
                                _this._logAction('log', '- Доступы на папку ' + folder.title + ' есть у ' +
                                    perms.length + ' пользователей');

                                function loopPermissions(i, permissions, onFinish) {
                                    console.log('LOOPPERMISSIONS ' + i);

                                    if (i < permissions.length) {
                                        var permission = permissions[i];

                                        if ((permission.emailAddress === _this._toUser.email) ||
                                            (permission.emailAddress === _this._fromUser.email) ||
                                            permission.deleted
                                        ) {
                                            loopPermissions(i + 1, permissions, onFinish);
                                        } else {
                                            var body = {
                                                'emailAddress': permission.emailAddress,
                                                'type': permission.type,
                                                'role': permission.role
                                            };
                                            var request = gapi.client.drive.permissions.insert({
                                                'fileId': newFolder.id,
                                                'sendNotificationEmails': false,
                                                'resource': body
                                            });

                                            request.execute(function (resp) {
                                                _this._logAction('log',
                                                    '-- Проставлены разрешения: ' + newFolder.title + ' : ' + body.emailAddress
                                                );
                                                //_this._logAction('log', '-- Жду одну секунду, чтобы не упереться в лимит операций...');
                                                setTimeout(function () {
                                                    loopPermissions(i + 1, permissions, onFinish);
                                                }, 1000);
                                            });
                                        }
                                    } else {
                                        onFinish();
                                    }
                                }

                                //_this._logAction('log', '-- Жду одну секунду, чтобы не упереться в лимит операций...');
                                setTimeout(function () {
                                    loopPermissions(0, perms, moveChildren);
                                }, 1000);
                            } else {
                                moveChildren();
                            }
                        });
                    });
                });
            },

            _copyFileWithPermissions(file, cb) {
                var _this = this;
                var body = { 'title': file.title };
                var request = gapi.client.drive.files.copy({
                    'fileId': file.id,
                    'resource': body
                });

                request.execute(function (newFile) {
                    if (newFile.code) {
                        _this._logAction('log', '-- Ошибка!!! ' + newFile.message);
                        cb();
                        return;
                    }

                    _this._logAction('log', '- Скопировал: ' + file.title);
                    var body = { 'title': 'OLD - ' + file.title };
                    var request = gapi.client.drive.files.patch({
                        'fileId': file.id,
                        'resource': body
                    });

                    request.execute(function (resp) {
                        if (resp.code) {
                            _this._logAction('log', '- Ошибка при переименовании!!! ' + resp.message);
                        }

                        _this._logAction('log', '- Переименован старый: ' + resp.title);

                        _this._logAction('log', '- Получаю информацию о доступах: ' + file.title);

                        _this._getFilePermissions(file, function(perms) {
                            _this._logAction('log', '-- Доступы на файл ' + file.title + ' есть у ' +
                                perms.length + ' пользователей');

                            function loopPermissions(i, permissions, onFinish) {
                                console.log('LOOPPERMISSIONS ' + i);

                                if (i < permissions.length) {
                                    var permission = permissions[i];

                                    if ((permission.emailAddress.trim() === _this._toUser.email.trim()) ||
                                        (permission.emailAddress.trim() === _this._fromUser.email.trim()) ||
                                        permission.deleted
                                    ) {
                                        loopPermissions(i + 1, permissions, onFinish);
                                    } else {
                                        var body = {
                                            'emailAddress': permission.emailAddress,
                                            'type': permission.type,
                                            'role': permission.role
                                        };
                                        var request = gapi.client.drive.permissions.insert({
                                            'fileId': newFile.id,
                                            'sendNotificationEmails': false,
                                            'resource': body
                                        });

                                        request.execute(function (resp) {
                                            _this._logAction(
                                                '-- Проставлены разрешения: ' + newFile.title + ' : ' + body.emailAddress
                                            );
                                            //_this._logAction('log', '-- Жду одну секунду, чтобы не упереться в лимит операций...');
                                            setTimeout(function() {
                                                loopPermissions(i + 1, permissions, onFinish);
                                            }, 1000);
                                        });
                                    }
                                } else {
                                    onFinish();
                                }
                            }
                            //_this._logAction('log', '-- Жду одну секунду, чтобы не упереться в лимит операций...');
                            setTimeout(function () {
                                loopPermissions(0, perms, cb);
                            }, 1000);
                        });
                    });
                });
            },

            _logAction(action, data) {
                var text;

                function pathHtml(html, item) {
                    if (html) html += ' → ';
                    var image = item.iconLink || item.image;
                    html += (image ? '<img height="20" src="' + image + '"/> ' : '') + item.title;
                    return html;
                }

                if (action === 'log') {
                    text = data;
                }

                if (action === 'current') {
                    this._path.push(data);
                    text = '<h3>Работаю с ' + this._path.reduce(pathHtml, '') + '</h3>';
                }

                if (action === 'exit') {
                    text = '<h3>Выхожу из ' + this._path.reduce(pathHtml, '') + '</h3>';
                    this._path.pop();
                }


                var margin = this._path.length * 20 + 'px';

                if (text) {
                    bemDom.append(this.domElem, BEMHTML.apply({
                        block: 'step3',
                        elem: 'log',
                        text: text,
                        attrs: {
                            style: 'margin-left:' + margin
                        }
                    }));

                    bemDom.win.scrollTop(100000);
                }
            }
        },
        {
            lazyInit: true
        })
    );
});
