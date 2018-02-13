({
    mustDeps: 'step1',

    shouldDeps: [
        'auth-button', 'step0', 'step1', 'step2', 'step3',
        {
            block: 'spin',
            mods: {
                theme: 'islands',
                size: 'xl',
                visible: true
            }
        },
        {
            elems: 'js'
        }
    ]
});
