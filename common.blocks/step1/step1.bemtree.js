block('step1').content()(function() {
    return [
        {
            block: 'heading',
            content: [
                'Шаг 1',
                {
                    block: 'subheading',
                    content: 'Авторизуйтесь под аккаунтом, на который нужно перенести файлы'
                }
            ]
        },
        {
            block: 'auth-button'
        }
    ];
});
