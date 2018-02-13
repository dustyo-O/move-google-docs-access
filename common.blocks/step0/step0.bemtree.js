block('step0').content()(function() {
    return [
        {
            block: 'heading',
            content: [
                'Шаг 0',
                {
                    block: 'subheading',
                    content: 'Авторизуйтесь под аккаунтом, с которого нужно перенести файлы'
                }
            ]
        },
        {
            block: 'auth-button'
        },
        ' или введите email: ',
        {
            block: 'email-chooser'
        }
    ];
});
