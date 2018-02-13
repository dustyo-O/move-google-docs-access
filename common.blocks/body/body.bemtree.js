block('body').content()(function() {
    return [
        {
            block: 'spin',
            mods: {
                theme: 'islands',
                size: 'xl',
                visible: true
            }
        }, {
            block: 'step0'
        }, {
            block: 'step1'
        }, {
            block: 'step2'
        }, {
            block: 'step3'
        }, {
            elem: 'js',
            js: {
                url: 'https://apis.google.com/js/api.js'
            }
        }
    ];
});
