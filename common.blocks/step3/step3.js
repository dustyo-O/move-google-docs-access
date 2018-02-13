modules.define('step3', ['i-bem-dom', 'spin'], function (provide, bemDom, Spin) {
    provide(bemDom.declBlock(this.name,
        {
            run(data) {
                var _this = this;
                function loopFolders(i, folders, onFinish) {
                    console.log('LOOPFOLDERS ' + i);
                    if (i < folders.length) {
                        var folder = folders[i];
                        _this._retrievePage(folder, null, null, function () {
                            //_this._logAction('Жду одну секунду, чтобы не упереться в лимит операций...');
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
                this._filesLimit = 5;
                this._foldersProcessed = 0;
                this._foldersLimit = 5;
                this._foldersDone = [];
                this._filesDone = [];

                this._fromUser = data.fromUser;
                this._toUser = data.toUser;

                loopFolders(0, data.folders, function() {
                    _this._logAction('Готово!');
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

                if (!this._foldersLimit || this._foldersLimit > 10) return;
                if (!this._filesLimit || this._filesLimit > 10) return;

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
                            _this._logAction(' Нет информации/уже обработанный файл, пропускаю...');
                            //_this._logAction(' Жду одну секунду, чтобы не упереться в лимит операций...');

                            setTimeout(function () {
                                loopResult(i + 1, result, onFinish);
                            }, 100);
                        } else {
                            _this._getFileOwner(file, function(owner) {
                                console.log('OWNER ', owner);
                                if (owner.emailAddress === _this._fromUser.email) {
                                    var process;

                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        process = _this._processFolder.bind(_this);
                                    } else {
                                        process = _this._processFile.bind(_this);
                                    }

                                    console.log(process.toString());

                                    process(file, function() {
                                        //_this._logAction(' Жду одну секунду, чтобы не упереться в лимит операций...');

                                        setTimeout(function() {
                                            console.log(i + 1);
                                            loopResult(i + 1, result, onFinish);
                                        }, 100);
                                    });
                                } else {
                                    if (!owner.emailAddress) {
                                        _this._logAction(' ВНИМАНИЕ! Нет информации о владельце файла! ' + file.title);
                                    } else {
                                        _this._logAction(' Владелец файла ' + file.title + ' - другой пользователь ');
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
                                    //_this._logAction(' Жду одну секунду, чтобы не упереться в лимит операций...');
                                }
                            });

                        }
                    } else {
                        onFinish();
                    }
                }
                //_this._logAction('Жду одну секунду, чтобы не упереться в лимит операций...');

                setTimeout(function () {
                    loopResult(0, result, cb);
                }, 1000);

            },

            _processFolder(folder, cb) {
                this._logAction('Folder: ' + folder.title);
                if (this._foldersDone.indexOf(folder.id) !== -1) {
                    this._logAction(' Папка: ' + folder.title + '  уже была обработана');
                    cb();
                } else {
                    this._foldersDone.push(folder.id);

                    if (this._foldersProcessed < this._foldersLimit) {
                        this._foldersProcessed++;
                        var _this = this;
                        this._copyFolderWithPermissions(folder, function() {
                            _this._retrievePage(folder.id, null, null, cb);
                        });
                    } else {
                        this._retrievePage(folder.id, null, null, cb);
                    }
                }

            },

            _processFile(file, cb) {
                this._logAction('File: ' + file.title);

                if (this._filesDone.indexOf(file.id) !== -1) {
                    this._logAction(' Файл: ' + file.title + ' уже был обработан');
                    cb();
                } else {
                    if (file.title.indexOf('OLD -') === -10) {
                        this._logAction(' Это старый файл, пропускаю');
                        cb();
                    } else {
                        if (this._filesProcessed < this._filesLimit) {
                            this._filesProcessed++;
                            this._filesDone.push(file.id);
                            this._copyFileWithPermissions(file, cb);
                        } else {
                            cb();
                        }
                    }
                }
            },

            _getFileOwner(file, cb) {
                this._logAction(' Определяю владельца: ' + file.title);

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
                        _this._logAction(' Ошибка!!! ' + resp.message);
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
                        _this._logAction(' Ошибка!!! ' + newFolder.message);
                        cb();
                        return;
                    }

                    _this._logAction(' Сделана копия папки: ' + newFolder.title);

                    var body = { 'title': 'OLD - ' + folder.title };
                    var request = gapi.client.drive.files.patch({
                        'fileId': folder.id,
                        'resource': body
                    });

                    request.execute(function (resp) {
                        if (resp.code) {
                            _this._logAction(' Ошибка при переименовании!!! ' + resp.message);
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
                                                    _this._logAction(' Ошибка!!! ' + newFolder.message);
                                                }

                                                //_this._logAction(' Жду одну секунду, чтобы не упереться в лимит операций...');
                                                setTimeout(function () {
                                                    loopChildren(i + 1, children, onFinish);
                                                }, 1000);
                                            });
                                        } else {
                                            onFinish();
                                        }
                                    }

                                    if (children && children.length) {
                                        _this._logAction(' Переношу детей для папки ' + newFolder.title);
                                        loopChildren(0, children, cb);
                                    } else {
                                        _this._logAction(' Нет детей у папки ' + newFolder.title);
                                        cb();
                                    }
                                });
                            }

                            if (perms) {
                                _this._logAction('- Доступы на папку ' + folder.title + ' есть у ' +
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
                                                _this._logAction(
                                                    '-- Проставлены разрешения: ' + newFolder.title + ' : ' + body.emailAddress
                                                );
                                                //_this._logAction('-- Жду одну секунду, чтобы не упереться в лимит операций...');
                                                setTimeout(function () {
                                                    loopPermissions(i + 1, permissions, onFinish);
                                                }, 1000);
                                            });
                                        }
                                    } else {
                                        onFinish();
                                    }
                                }

                                //_this._logAction('-- Жду одну секунду, чтобы не упереться в лимит операций...');
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
                        _this._logAction('-- Ошибка!!! ' + newFile.message);
                        cb();
                        return;
                    }

                    _this._logAction('- Скопировал: ' + file.title);
                    var body = { 'title': 'OLD - ' + file.title };
                    var request = gapi.client.drive.files.patch({
                        'fileId': file.id,
                        'resource': body
                    });

                    request.execute(function (resp) {
                        if (resp.code) {
                            _this._logAction('- Ошибка при переименовании!!! ' + resp.message);
                        }

                        _this._logAction('- Переименован старый: ' + resp.title);

                        _this._logAction('- Получаю информацию о доступах: ' + file.title);

                        _this._getFilePermissions(file, function(perms) {
                            _this._logAction('-- Доступы на файл ' + file.title + ' есть у ' +
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
                                            //_this._logAction('-- Жду одну секунду, чтобы не упереться в лимит операций...');
                                            setTimeout(function() {
                                                loopPermissions(i + 1, permissions, onFinish);
                                            }, 1000);
                                        });
                                    }
                                } else {
                                    onFinish();
                                }
                            }
                            //_this._logAction('-- Жду одну секунду, чтобы не упереться в лимит операций...');
                            setTimeout(function () {
                                loopPermissions(0, perms, cb);
                            }, 1000);
                        });
                    });
                });
            },

            _logAction(text) {
                bemDom.append(this.domElem, BEMHTML.apply({
                    block: 'step3',
                    elem: 'log',
                    text: text
                }));

                bemDom.win.scrollTop(100000);
            }
        },
        {
            lazyInit: true
        })
    );
});
