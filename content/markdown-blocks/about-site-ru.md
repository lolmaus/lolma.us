---
id: about-site-ru
title: Об этом сайте
---

Я задумал данный сайт как скромную демонстрацию моих навыков.

Он использует следующие возможности EmberJS:

*   Все страницы заранее отрендерены в статический HTML и отображаются мгновенно при загрузке страницы. Все ссылки работают как обычные HTML-ссылки. Когда подгружается Ember-приложение, оно перехватывает управление, превращая сайт в SPA. Это возможно благодаря [FastBoot](https://ember-fastboot.com) и [robwebdev/ember-cli-staticboot](https://github.com/robwebdev/ember-cli-staticboot).

*   Интернационализация (i18n): сайт доступен на двух языках. Переведены элементы интерфейса, контент и даты. Для перевода интерфейса я использую [jamesarosen/ember-i18n](https://github.com/jamesarosen/ember-i18n).

*   Responsive Web Design разработан с помощью моей Sass-библиотеки [lolmaus/breakpoint-slicer](https://github.com/lolmaus/breakpoint-slicer). Она позволяет очень удобно и быстро описывать правила применения стилей. Я бы предпочел использовать [lolmaus/ember-element-query](https://github.com/lolmaus/ember-element-query) для контроля над каждым элементом, но методика element queries требует JS, который недоступен в режиме StaticBoot.

*   Во время сборки, сайт обращается к API GitHub и StackOverflow для сбора рейтингов. Поскольку оба сервиса жестко ограничивают использование API, Ember-приложение обращается к API только в том случае, если рейтинги недоступны из FastBoot.

*   Реализована аутентификация к GitHub: можно залогиниться, чтобы ставить/снимать звездочки, не покидая приложения.

*   Контент хранится в виде Markdown с [Front Matter](https://jekyllrb.com/docs/frontmatter/). Для работы с ним (а также с данными GitHub и SO) используются точечно переопределенные адаптеры и сериализаторы.

*   Я не мог использовать [offirgolan/ember-burger-menu](https://github.com/offirgolan/ember-burger-menu), поскольку он не работает во время загрузки JS. Поэтому я погуглил и реализовал сдвижное меню на чистом CSS. У этого подхода есть ограничения, но в целом получилось супер!

Исходники сайта доступны на GitHub: [lolmaus/lolma.us](https://github.com/lolmaus/lolma.us).
