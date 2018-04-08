---
id: promise-proxy-mixin-ru
title: "PromiseProxyMixin: нативная альтернатива ember-concurrency"
summary: ember-concurrency — исключительно мощный и полезный аддон. Однако если ваш единственный юз-кейс — это обращаться к серверу, то взгляните на легковесную альтернативу
created: 2018-01-05
proficiency: beginner
---

<div class="exclamation"></div>

> Это перевод моей статьи, которую я изначально опубликовал в блоге компании Deveo. Когда она была поглощена компанией Perforce, ее блог был закрыт.




[ember-concurrency](http://ember-concurrency.com) — это исключительно мощный и удобный аддон, решающий множество разнообразных задач.

Однако самая типовая задача — просто обращаться к серверу: либо загружать данные, либо передавать. Вы можете посчитать чрезмерным устанавливать `ember-concurrency` только ради этого.

И будете совершенно правы. В Ember имеются все необходимые примитивы для решения этой задачи в том же стиле, что `ember-concurrency`: просто, эффективно и в рамках Ember way.



## Пример задачи

Позвольте продемонстрировать предлагаемый мной подход на простом примере. Мы будем получать с GitHub количество доступных обращений к GitHub API:

    GET http://api.github.com/rate_limit

Я выбрал именно этот API endpoint, потому что это единственный endpoint, который GitHub не ограничивает по количеству обращений. :trollface:

Давайте для начала реализуем метод загрузки данных:

```js
import Controller from '@ember/controller'
import fetch from 'fetch'

Controller.extend({
  _fetchGitHubRate () {
    return fetch('https://api.github.com/rate_limit')
      .then(response => response.json());
  },
});
```

Я использую аддон [ember-fetch](https://github.com/ember-cli/ember-fetch) ради его простоты, но на его месте может быть всё что угодно, что возвращает promise, например, сервис [ember-ajax](https://github.com/ember-cli/ember-ajax).

Метод может находиться не только в контроллере, но и в любой другой сущности Ember: компоненте, сервисе, модели и т. д.



## Встречайте `PromiseProxyMixin`

Вы наверняка слышали мнение, что возвращать promise из computed property (CP) — плохая идея. С [PromiseProxyMixin](https://emberjs.com/api/ember/2.18/classes/PromiseProxyMixin) это не так.

Давайте создадим класс, в который включим `PromiseProxyMixin`. Это можно сделать на верхнем уровне вашего модуля:

```js
import EmberObject from '@ember/object'
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin'

const PromiseObject = EmberObject.extend(PromiseProxyMixin);
```

Теперь мы можем обернуть promise в `PromiseObject`. Обязательно разделите promise и proxy на два отдельных свойства:

```js
// This CP returns a simple promise
gitHubRatePromise: computed(function () {
  return this._fetchGitHubRate();
}),

// This CP wraps the promise with with `PromiseObject` 
gitHubRateProxy: computed('gitHubRatePromise', function () {
  const promise = this.get('gitHubRatePromise');
  return promise && PromiseObject.create({promise});
}),
```

Обратите внимание на `promise &&`. Если promise отсутствует, proxy создаваться не должен, т. к. в этом случае он "упадет" с ошибкой.



## Обращение к содержимому promise'а

API endpoint, к которому мы обращаемся, возвращает данные в таком формате (фрагмент):

```js
{
  "resources": {
    "core": {
      "limit": 60,
      "remaining": 60,
      "reset": 1486831110
    },
}
```

Этот хэш будет доступен в шаблоне как `gitHubRateProxy.content`. Вы можете работать с этим свойством как обычно:

```js
  gitHubRate:          reads('gitHubRateProxy.content'),
  gitHubRateRemaining: reads('gitHubRate.resources.core.remaining'),
  gitHubRateLimit:     reads('gitHubRate.resources.core.limit'),
```

Пока promise не resolved, эти свойства будут иметь значение `undefined`. Когда мы будем использовать их в другом computed property, надо защититься от `undefined`:

```js
  gitHubRatePercentage: computed('gitHubRateRemaining', 'gitHubRateLimit', function () {
    const gitHubRateRemaining = this.get('gitHubRateRemaining');
    const gitHubRateLimit     = this.get('gitHubRateLimit');
    
    // We don't want a `NaN`!
    if (gitHubRateRemaining == null || gitHubRateLimit == null) return;
    
    const percentage  = Math.round(gitHubRateRemaining / gitHubRateLimit * 100);
    
    return `${percentage}%`;
  }),
```

Применим результат в шаблоне:

```handlebars
Your GitHub rate limit: {{gitHubRateRemaining}} ({{gitHubRatePercentage}})
```



## Как это работает

Изначально, CP `gitHubRatePromise` не рассчитано, и обращение к серверу не происходит.

Когда рендерится наш шаблон, происходит считывание свойства `gitHubRateRemaining`. Это CP зависит от `gitHubRateProxy`. Тот, в свою очередь, обращается к `gitHubRatePromise`.

При первом обращении к `gitHubRatePromise` выполняется метод `_fetchGitHubRate` и совершается запрос. Метод возвращает promise, который кэшируется в свойстве `gitHubRatePromise`.

Это означает, что при повторном обращении к свойству будет возвращаться один и тот же promise, и запрос не будет выполняться повторно. По сути, реализуется паттерн `drop` из `ember-concurrency`.

Свойство `gitHubRateProxy` оборачивае promise в proxy `PromiseObject`. Когда promise отресолвится, его resolve value станет доступно как `gitHubRateProxy.content`.

Обратите внимание, что данный подход декларативен. Вам не требуется делать этого:

```js
didInsertElement () {
  this._super()
  this.get('fetchGitHubRateTask').perform()
}
```



## Учитываем, что выполнение promise занимает время

Пока promise не отресолвится, содержимое `gitHubRateProxy.content` будет `undefined`. Это означает, что пока запрос выполняется, в шаблоне будет пустота. Давайте это исправим.

`PromiseProxyMixin` предоставляет свойство `gitHubRateProxy.isPending`. Воспользуемся им в шаблоне:

```handlebars
{{#if gitHubRateProxy.isPending}}

  Retrieving GitHub rate limit...

{{else}}

  Your GitHub rate limit: {{gitHubRateRemaining}} ({{gitHubRatePercentage}})
  
{{/if}}
```

Вполне естественная запись. Выходит, возвращать promise из computed property не так уж плохо! :wink:



## Учитываем, что запрос может завершиться неудачей

Внимательный четатель мог заметить проблему: если promise будет rejected, например, вследствие сетевого сбоя, то reject'нутое состояние promise'а будет закэшировано навсегда. В этом проявляется одно из преимуществ `ember-concurrency`: он позволяет без труда перезапустить задачу.

В случае с promise нам понадобиться написать несколько строк кода. Идея в том, чтобы перезаписать computed property `gitHubRatePromise` обычным, не computed, promise'ом:

```js
  actions: {
    refetchGitHubRate () {
      this.set('gitHubRatePromise', this._fetchGitHubRate());
    }
  },
```

Вызов этого action'а спровоцирует новый сетевой запрос. Соответствующий promise будет присвоен в свойство `gitHubRatePromise`, что вызовет пересчет всех свойств, которые от него зависят, и далее по цепочке.

Если promise будет rejected, то свойство `gitHubRateProxy.isRejected` примет значение `true`, а rejection value (обычно это объект Error) будет доступно в `gitHubRateProxy.reason`.

Давайте попробуем:

```handlebars
{{#if gitHubRateProxy.isRejected}}

  Failed to retrieve GitHub rate limit.<br>
    
  Reason: {{gitHubRateProxy.reason}}<br>
    
  <a href {{action 'refetchGitHubRate'}}>
    Retry
  </a>
    
{{else if gitHubRateProxy.isPending}}

  Retrieving GitHub rate limit...

{{else}}

  Your GitHub rate limit: {{gitHubRateRemaining}} ({{gitHubRatePercentage}})
  
{{/if}}
```


## Демо

Посмотреть полный код примера и попробовать его в деле вы можете [на Ember Twiddle](https://ember-twiddle.com/f645d337712394d2ebdf0a7ddd061897?numColumns=2&openFiles=controllers.application.js%2Ctemplates.application.hbs):

<iframe src="https://ember-twiddle.com/f645d337712394d2ebdf0a7ddd061897?fullScreen=true" style="width: 100%; height: 500px; border: 2px solid biege;"></iframe><br>

[Тут](https://ember-twiddle.com/bf8285db75b057eb99aea8cb0e2791ab?numColumns=2&openFiles=controllers.application.js%2Ctemplates.application.hbs) вы найдете аналогичный пример на `ember-concurrency` для сравнения.



## Переносим логику в севрис для переиспользования

Если вы поместили описанную логику в компонент, который используется в двух разных маршрутах, то при переходе между маршрутами данные будут запрашиваться повторно, поскольку при покидании маршрута компонент уничтожается, а вместе с ним и promise.

Вероятно, предпочтительнее будет не перезапрашивать данные при смене маршрута, а делать это только по запросу. Для этого promise должен кэшироваться глобально и не быть привязан к компоненту.

Очевидное решение — поместить эту логику в сервис. Очень удобно для этого расширять сервис [ember-ajax](https://github.com/ember-cli/ember-ajax).



## `Ember.ObjectProxy` не нужен

[Официальная документация по PromiseProxyMixin](https://emberjs.com/api/ember/2.18/classes/PromiseProxyMixin) предлагает использовать`Ember.ObjectProxy` в качестве базвого класса для примешивания `PromiseProxyMixin`. Однако `ObjectProxy` применяет кое-какую черную магию, из-за чего я предпочитаю его избегать.

Единственное преимущество `ObjectProxy` — это сократить этот путь:

    gitHubRateProxy.content.resources.core.remaining

до этого:

    gitHubRateProxy.resources.core.remaining

Всего лишь пропадает необходимость писать `.content`. Не такая уж большая польза.

Естественно, эта черная магия не работает с массивами. Для массивов предлагается использовать `Ember.ArrayProxy`, который в свою очередь не работает с объектами. А если ваш promise возвращает инстанс класса, а не просто хэш, то не подходит ни один из вариантов.

`Ember.Object`, напротив, универсален. Необходимость дописывать `.content` — это малая цена за прозрачность происходящего. Я думаю, `ObjectProxy` and `ArrayProxy` — это пережитки времен давно ушедших  `ObjectController` и `ArrayController`.



## `ember-deferred-content` и `ember-async-button` тоже не нужны

Эти два аддона оборачивают promise в proxy на уровне шаблона. Они предлагают своеобразные шаблонные конструкции, не имея никаких преимуществ над `PromiseProxyMixin`.

Сравните:

```handlebars
{{#if gitHubRateProxy.isRejected}}

  Failed to retrieve GitHub rate limit.<br>
    
  Reason: {{gitHubRateProxy.reason}}<br>
    
  <a href {{action 'refetchGitHubRate'}}>
    Retry
  </a>
    
{{else if gitHubRateProxy.isPending}}

  Retrieving GitHub rate limit...

{{else}}

  Your GitHub rate limit: {{gitHubRateRemaining}} ({{gitHubRatePercentage}})
  
{{/if}}
```

```handlebars
{{#deferred-content gitHubRatePromise as |d|}}
  {{#d.pending}}
    Retrieving GitHub rate limit...
  {{/d.pending}}

  {{#d.fulfilled as |gitHubRate|}}
    Your GitHub rate limit:

    {{gitHubRate.resources.core.remaining}}

    ({{multiply
      (divide gitHubRate.resources.core.remaining gitHubRate.resources.core.limit)
      100
    }}%)
  {{/d.fulfilled}}

  {{#d.rejected as |reason|}}
    Failed to retrieve GitHub rate limit.<br>
      
    Reason: {{reason}}<br>
      
    <a href {{action 'refetchGitHubRate'}}>
      Retry
    </a>
  {{/d.rejected}}
{{/deferred-content}}
```

Обратите внимание, что `ember-deferred-content` вынуждает вас вычислять проценты на уровне шаблона.



## Я не отговариваю вас использовать `ember-concurrency`

Основная цель этой статьи — показать вам данный прием и заставить немного задуматься. Этот прием весьма практичен, и я часто пользуюсь им в своих проектах, где не используется `ember-concurrency`.

Отказаться от `ember-concurrency` в пользу `PromiseProxyMixin` можно по двум причинам:

* вы считаете каждый килобайт размера вашего дистрибутива;
* вы хотите обойтись без лишних сущностей, слоев и абстракций.

Если же вы уже хорошо знакомы с `ember-concurrency`, и он включен в ваш проект, то использовать `PromiseProxyMixin` нет смысла. Скорее всего, код на `ember-concurrency` получится немного короче:

```js
gitHubRateTask: task(function * () {
  return yield this._fetchGitHubRate();
}).restartable().on('didInsertElement')

gitHubRate:          reads('gitHubRateTask.last.value'),
gitHubRateRemaining: reads('gitHubRate.resources.core.remaining'),
gitHubRateLimit:     reads('gitHubRate.resources.core.limit'),

// Если этого не сделать, запрос не будет выполнен. Императивненько. :(
didInsertElement () {
  this._super()
  this.get('fetchGitHubRateTask').perform()
}
```

Повторяю [ссылку](https://ember-twiddle.com/bf8285db75b057eb99aea8cb0e2791ab?numColumns=2&openFiles=controllers.application.js%2Ctemplates.application.hbs) на пример, выполненный на `ember-concurrency`.



## Обращение к предыдущему ответу сервера, после того как повторный запрос завершился неудачей

Представьте такую ситуацию. Мы опрашиваем сервер каждую секунду, чтобы показывать актуальные данные. Мы хотим, чтобы в случае сетевого сбоя на экране продолжали отображаться последние успешно запрошенные данные.

`ember-concurrency` предоставляет доступ к последним значениям resolution и rejection, если они имеются. Они остаются доступны, даже если задача перезапущена:

```handlebars
{{gitHubRateTask.lastSuccessful.value}}
```

Если мы поступим так же с `PromiseProxyMixin`, то значение на странице будет моргать каждую секунду. Ведь при каждом повторном запросе promise перезаписывается, и предыдущее resolution value становится недоступным.

Проще всего решить проблему, добавив `.then(result => this.set('result', result))` к promise, чтобы resolution value извлекался из promise и хранился отдельно.

Это нормальное решение, но оно мне не нравится своей императивностью. Вместо этого, взгляните на такой CP макрос:

```js
function cachingMacro (key) {
  let cache

  return computed(key, function () {
    const value = this.get(key)
    
    return value == null
      ? cache
      : cache = value
  })
}
```

Его можно использовать так:

```js
gitHubRate:          cachingMacro('gitHubRateProxy.content'),
gitHubRateRemaining: reads('gitHubRate.resources.core.remaining'),
gitHubRateLimit:     reads('gitHubRate.resources.core.limit'),
```

В результате, когда promise перезаписывается вторым promise'ом, который завершается неудачей, свойство `gitHubRate` будет по-прежнему хранить resolution value первого promise'а.

Ну или вы можете применить `ember-concurrency` в конце концов. :grimacing:



## Что скажете?

Обязательно поделитесь вашими соображениями, возражениями и идеями в комментариях внизу. Самая ценная часть любой статьи — это всегда обсуждение, которое за ней следует!
