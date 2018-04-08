---
id: class-and-attribute-bindings-ru
title: Делаем динамические binding'и HTML-классов и атрибутов из родительского шаблона
summary: Стандартный способ применить динамические binding'и классов и атрибутов к компоненту ­— это определить их в классе компонента. Для встроенных и аддоновых компонентов для этого потребуется переопределять классы, чего часто делать не хочется. Хотелось бы просто передать binding'и из родительского шаблона без переопределения классов, но это работает не так, как вы думаете.
created:  2018-01-06
proficiency: beginner
---

<div class="exclamation"></div>

> Это перевод моей статьи, которую я изначально опубликовал в блоге компании Deveo. Когда она была поглощена компанией Perforce, ее блог был закрыт.



Каждый Ember-разработчик делал это много раз:

```js
Ember.Component.extend({
  validationResult: Ember.computed(/*...*/),
  classNameBindings: ['validationResult:is-valid:is-invalid']
})
```

Ember применит к компоненту класс `is-valid` либо `is-invalid`, в зависиости от значения свойства `validationResult`.

В данном случае, свойство `validationResult` должно быть объявлено на самом компоненте. А где же еще, спросите вы?



## Пробуем передать `classNameBindings` из родительского шаблона

Желание передать `classNameBindings` из родительского шаблона может возникнуть в том случае, если вам нужно применить динамический класс к компоненту, написанному не вами (встроенному в Ember или происходящему из аддона), и вам не хочется переопределять класс только ради этого.

Моя интуиция подсказывает мне сделать так, но это **не заработает**:

```handlebars
{{textarea
  validationResult  = (gte myText.length 100),
  classNameBindings = 'validationResult:is-valid:is-invalid'
}}
```


## Что происходит

`classNameBindings` работает на основе устаревшего механизма binding'ов, который задокументирован [тут](http://emberjs.com/api/classes/Ember.Binding.html) и будет удален в Ember 3.

Историчеки, binding'и в Ember создавались при помощи этого низкоуровневого API. Затем ему на смену пришел удобный высокоуровневый API, которым мы пользуемся сейчас, и вместо `myPropBinding='foo'` мы пишем просто `myProp=foo`. Обратите внимание, что в первом случае название свойства передается в кавычках.

Упрощая нюансы, этот код:

```handlebars
{{textarea
  classNameBindings = 'validationResult:is-valid:is-invalid'
}}
```

примерно эквивалентен этому:

```handlebars
{{textarea
  classNames = (if validationResult 'is-valid' 'is-invalid')
}}
```

Но если вы попытаетесь сделать так, как показано в последнем примере, binding не будет динамическим. HTML-класс корректно примет исходное значение, но при изменении `validationResult` обновляться не будет.

Для решения этой проблемы и нужны `classNameBinding`



## Как правильно использовать `classNameBindings` на примере компонента `{{textarea}}` без его переопределения

Свойство, которое вы указываете в `classNameBindings` в родительском шаблоне, должно быть объявлено в родительском компоненте/контроллере:

```js
// app/components/parent-component.js
Ember.Component.extend({
  name: 'Mike',
  validationResult: Ember.computed.gte('name.length', 100),
})
```

```handlebars
{{! app/components/parent-component.hbs }}

{{textarea
  classNameBindings = 'validationResult:is-valid:is-invalid'
}}
```

Очень важно понимать, чем этот пример отличается от самого первого примера статьи. На первый взгляд, они одинаковы, но это не так.

* В первом примере статьи `classNameBindings` объявлен в классе дочернего компонента и ищет свойства в контексте дочернего компонента.

* А в данном примере, `classNameBindings` хоть и передается в дочерний компонент, но прописан в родительском шаблоне и ищет свойства в родительском контексте!



## Прописать несколько свойств в `classNameBindings` из родительского шаблона невозможно

Согласно [документации компонента](https://emberjs.com/api/ember/2.18/classes/Component/properties/classNameBindings?anchor=classNameBindings), свойство `classNameBindings` должно содержать массив.

Я предполагал, что это сработает, но оно не работает:

```handlebars
{{textarea
  classNameBindings = (array 'validationResult:is-valid:is-invalid')
}}
```

Я не нашел способа передать больше одного свойства в `classNameBindings`. Для этого все-таки требуется (пере)определять класс компонента и прописывать `classNameBindings` в нем.

К счастью, есть способ лучше.



## Используйте class вместо classNameBindings в родительском шаблоне!

Свойство `class`, недоступное при объявлении класса компонента, можно передавать в компонент из родительского шаблона. И в нем можно передавать несколько binding'ов!

Вы наверняка делали это много раз:

```handlebars
<div class = "foo {{bar}} {{if baz 'quux' 'zomg'}}">
```

При передаче `class` потребуется конкатенация:

```handlebars
{{my-component
  class = (concat 'foo ' bar (if baz ' quux' ' zomg'))
}}
```

Обратите внимание на дополнительные пробелы в строковых литералах.



## Что насчет attributeBindings?

Ember (Glimmer?) запрещет передавать `attributeBindings` из родительского шаблона. Такая запись сломает ваше приложение:

```handlebars
{{my-component
  attributeBindings = "foo"
}}
```

Некоторые Ember-аддоны используют mixin, который bind'ит все переданные извне свойства на HTML-атрибуты. С помощью такого mixin'а можно делать так:

```handlebars
{{my-component
  disabled = isDisabled
  data-foo = "bar"
}}
```

К примеру, вот как выглядит приватный mixin `dynamic-attribute-bindings` аддона `ember-one-way-controls` [https://github.com/DockYard/ember-one-way-controls/blob/v3.0.1/addon/-private/dynamic-attribute-bindings.js](uses internally):

```js
// https://github.com/DockYard/ember-one-way-controls/blob/v3.0.1/addon/-private/dynamic-attribute-bindings.js
import Ember from 'ember';

const { Mixin, set } = Ember;

export default Mixin.create({
  NON_ATTRIBUTE_BOUND_PROPS: ['class', 'classNames'],
  concatenatedProperties: ['NON_ATTRIBUTE_BOUND_PROPS'],
  init() {
    this._super(...arguments);

    let newAttributeBindings = [];
    for (let key in this.attrs) {
      if (this.NON_ATTRIBUTE_BOUND_PROPS.indexOf(key) === -1 && this.attributeBindings.indexOf(key) === -1) {
        newAttributeBindings.push(key);
      }
    }

    set(this, 'attributeBindings', this.attributeBindings.concat(newAttributeBindings));
  }
});
```

Обратите внимание, что этот mixin использует черный список. Все свойства, которые не упомянуты в `NON_ATTRIBUTE_BOUND_PROPS`, будут за'bind'ены на HTML-атрибуты. Свойство NON_ATTRIBUTE_BOUND_PROPS помечено как concatenated, т. е. если вы  его переопределите, то вместо переопределения произойдет пополнение массива, содержащегося в свойстве.

Вы можете изменить эту логику под свои задачи, например, применив белый список вместо черного.



## Знаете больше? Поделитесь!

Выражаю благодарность Ricardo Mendes ([@locks](https://github.com/locks)) за терпеливые разъяснения о том, как работает `classNameBindings`.

Если вы увидите неточность в статье или можете лучше объяснить, что происходит с binding'ами классов и атрибутов, обязательно поделитесь в комментариях!
