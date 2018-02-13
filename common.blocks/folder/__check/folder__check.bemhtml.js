block('folder').elem('check')(
    addJs()(true),

    tag()('span'),

    content()(function () {
        return {
            block: 'checkbox',
            mods: {
                theme: 'islands',
                size: 'l',
                checked: this.ctx.checked
            }
        };
    })
);
