modules.define('body__js', ['i-bem-dom', 'BEMHTML'], function (provide, bemDom, BEMHTML) {

    provide(bemDom.declElem('body', 'js',
        {
            onSetMod: {
                js: {
                    inited: function() {
                        var apiScript = {
                            tag: 'script',
                            attrs: {
                                src: this.params.url,
                                async: true,
                                defer: true
                            }
                        };

                        bemDom.append(this.domElem, BEMHTML.apply(apiScript));

                        this._interval = setInterval((function () {
                            if (typeof gapi !== 'undefined') {
                                clearInterval(this._interval);
                                this._onLoad();
                            }
                        }).bind(this), 100);
                    }
                }
            },

            _onLoad() {
                this._emit('load');
            }
        },
        {
            lazyInit: false
        }));
});
