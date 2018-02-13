block('folder')(
    addJs()(function() {
        return {
            id: this.ctx.id
        };
    }),

    content()(function() {
        var ctx = this.ctx;

        return [
            {
                elem: 'check',
                checked: ctx.checked
            },
            {
                block: 'image',
                url: ctx.icon
            },
            {
                elem: 'title',
                title: ctx.title
            }
        ]
    })
);
