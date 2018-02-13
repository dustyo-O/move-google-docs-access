block('auth-button')(
    addJs()(true),

    content()(function () {
        return {
            block: 'button',
            mods: { theme: 'islands', size: 'l' },
            text: 'Войти'
        };
    })
);
