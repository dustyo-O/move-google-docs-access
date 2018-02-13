modules.define('body',
['i-bem-dom', 'step0', 'step1', 'step2', 'step3', 'spin', 'body__js'],
function (provide, bemDom, Step0, Step1, Step2, Step3, Spin, BodyJs) {
    provide(bemDom.declBlock(this.name,
        {
            _onStep0Complete: function(e, data) {
                this._fromUser = data;
                console.log(data);
                this.findChildBlock(Step1).setMod('visible');
            },

            _onStep1Complete: function(e, data) {
                this._toUser = data;
                console.log(data);
                this.findChildBlock(Step2).setMod('run');
            },

            _onStep2Complete: function (e, data) {
                this._folders = data;
                this.findChildBlock(Step3).run({
                    fromUser: this._fromUser,
                    toUser: this._toUser,
                    folders: this._folders
                });
            },

            _onApiLoad: function() {
                var onClientReady = this._onClientReady.bind(this);
                gapi.load('client:auth2', function() {
                    gapi.client.load('drive', 'v2', onClientReady);
                });
            },

            _onClientReady: function() {
                this.findChildBlock(Spin).delMod('visible');
                this.findChildBlock(Step0).setMod('visible');
            }
        },
        {
            lazyInit: true,

            onInit: function () {
                this._events(Step0).on('gotUserInfo', this.prototype._onStep0Complete);
                this._events(Step1).on('gotUserInfo', this.prototype._onStep1Complete);
                this._events(Step2).on('gotFolders', this.prototype._onStep2Complete);

                this._events(BodyJs).on('load', this.prototype._onApiLoad)
            }
        })
    );
});
