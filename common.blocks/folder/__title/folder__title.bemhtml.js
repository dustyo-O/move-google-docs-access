block('folder').elem('title')(
    addJs()(true),

    tag()('span'),

    content()(function () {
        var ctx = this.ctx;

        return {
            block: 'button',
            mods: {
                theme: 'islands',
                size: 'm',
                type: 'link',
                view: 'plain'
            },
            text: ctx.title
        };
    })
);
