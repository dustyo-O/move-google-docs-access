([{
    shouldDeps: [
        {
            block: 'spin',
            mods: {
                theme: 'islands',
                size: 'xl',
                visible: true
            }
        },
        {
            elems: 'log'
        }
    ]
}, {
    tech: 'js',
    shouldDeps: {
        elems: 'log',
        tech: 'bemhtml'
    }
}]);
