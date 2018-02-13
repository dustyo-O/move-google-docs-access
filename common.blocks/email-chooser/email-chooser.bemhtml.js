block('email-chooser')(
    addJs()(true),

    tag()('form'),

    content()(function () {
        return [{
            block: 'input',
            mods: { theme: 'islands', size: 'l' },
        }, {
            block: 'button',
            mods: { theme: 'islands', size: 'l', type: 'submit' },
            text: 'Выбрать email'
        }];
    })
);
