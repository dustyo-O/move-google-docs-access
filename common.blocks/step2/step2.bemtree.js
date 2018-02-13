block('step2').content()(function() {
    return [
        {
            block: 'heading',
            content: [
                'Шаг 2',
                {
                    block: 'subheading',
                    content: 'Выберите папки, в которых надо осуществить перенос'
                }
            ]
        },
        {
            elem: 'folders'
        },
        {
            block: 'button',
            mods: { theme: 'islands', size: 'l' },
            text: 'Продолжить с выбранными папками'
        },
        {
            block: 'spin'
        }
    ];
});
