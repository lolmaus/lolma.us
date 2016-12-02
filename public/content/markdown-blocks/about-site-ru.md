---
id: about-site-ru
title: Об этом сайте
---

Я задумал данный сайт как скромную демонстрацию моих навыков.

Он использует следующие возможности EmberJS:

*   Все страницы заранее отрендерены в статический HTML и отображаются мгновенно при загрузке страницы. Все ссылки работают как обычные HTML-ссылки. Когда подгружается Ember-приложение, оно перехватывает управление, превращая сайт в SPA. Это возможно благодаря <a href="https://ember-fastboot.com" target="_blank">FastBoot</a> и <a href="https://github.com/robwebdev/ember-cli-staticboot" target="_blank">robwebdev/ember-cli-staticboot</a>.

*   Интернационализация (i18n): сайт доступен на двух языках. Переведены элементы интерфейса, контент и даты. Для перевода интерфейса я использую <a href="https://github.com/jamesarosen/ember-i18n" target="_blank">jamesarosen/ember-i18n</a>.

*   Responsive Web Design разработан с помощью моей Sass-библиотеки <a href="https://github.com/lolmaus/breakpoint-slicer" target="_blank">lolmaus/breakpoint-slicer</a>. Она позволяет очень удобно и быстро описывать правила применения стилей. Я бы предпочел использовать <a href="https://github.com/lolmaus/ember-element-query" target="_blank">lolmaus/ember-element-query</a> для контроля над каждым элементом, но методика element queries требует JS, который недоступен в режиме StaticBoot.

*   Во время сборки, сайт обращается к API GitHub и StackOverflow для сбора рейтингов. Поскольку оба сервиса жестко ограничивают использование API, Ember-приложение обращается к API только в том случае, если рейтинги недоступны из FastBoot.

*   Реализована аутентификация к GitHub: можно залогиниться, чтобы ставить/снимать звездочки, не покидая приложения.

*   Контент хранится в виде Markdown с <a href="https://jekyllrb.com/docs/frontmatter/" target="_blank">Front Matter</a>. Для работы с ним (а также с данными GitHub и SO) используются точечно переопределенные адаптеры и сериализаторы.

*   Я не мог использовать <a href="https://github.com/offirgolan/ember-burger-menu" target="_blank">offirgolan/ember-burger-menu</a>, поскольку он не работает во время загрузки JS. Поэтому я погуглил и реализовал сдвижное меню на чистом CSS. У этого подхода есть ограничения, но в целом получилось супер!

Исходники сайта доступны на GitHub: <a href="https://github.com/lolmaus/lolma.us" target="_blank">lolmaus/lolma.us</a>.
