---
id: class-and-attribute-bindings-en
title: What you didn't know about passing dynamic classname and attribute bidings from parent template
summary: The straightforward way of applying dynamic class/attribute bindings to a component is within that component's class definition. For build-in and third-party components that would require subclassing, which is often undesirable. It's tempting to pass the bindings from a parent template without subclassing, but that works not how you think it works.
created: 2017-04-13
updated: 2018-01-06
proficiency: beginner
---

<div class="exclamation"></div>

> This article was originally posted on Deveo blog.
> 
> When Deveo was acquired by Perforce, Deveo blog was turned down.



Every Ember developer has done this many times:

```js
Ember.Component.extend({
  validationResult: Ember.computed(/*...*/),
  classNameBindings: ['validationResult:is-valid:is-invalid']
})
```

Ember will apply either `is-valid` or `is-invalid` HTML class to the component depending on whether `validationResult` property is truthy.

In this case, the `validationResult` property is looked upon the component.



## Trying to pass `classNameBindings` externally

There are situations when you want to pass `classNameBindings` into a component from the parent template.

Say, you need a custom HTML class on the `{{textarea}}` component, but you don't want to bother subclassing the `Ember.TextArea` component. Why create a custom component when you can simply pass `classNameBindings` and `validationResult` into the standard `{{textarea}}`, right?

This is what my intuition tells me to do, but it **does not work**:

```handlebars
{{textarea
  validationResult  = (gte myText.length 100),
  classNameBindings = 'validationResult:is-valid:is-invalid'
}}
```


## What happens

`classNameBindings` is operated by Ember's **deprecated** binding mechanism. The mechanism is documented [here](http://emberjs.com/api/classes/Ember.Binding.html) and is removed in Ember 3.

Historically, this low-level API was used to set up bindings in EmberJS. Then it was replaced with the convenient high-level API that we know today, and instead of `myPropBinding='foo'` we can simply do `myProp=foo` in our templates. Note that the former uses quotes and the latter doesn't.

This code:

```handlebars
{{textarea
  classNameBindings = 'validationResult:is-valid:is-invalid'
}}
```

is roughly equivalent to this:

```handlebars
{{textarea
  classNames = (if validationResult 'is-valid' 'is-invalid')
}}
```

But if you use the latter in your template, the HTML class will not be dynamic. It will use the initial value of `validationResult`, and when `validationResult` changes, the HTML class will not be updated.

This is why `classNameBindings` is there for you.



## Passing `classNameBindings` into the default textarea component

You have to define the property on the *parent* component/controller and use its name in `classNameBindings`:

```js
// app/components/parent-component.js
Ember.Component.extend({
  validationResult: Ember.computed(/*...*/),
})
```

```handlebars
{{! app/components/parent-component.hbs }}

{{textarea
  classNameBindings = 'validationResult:is-valid:is-invalid'
}}
```

It is very important to understand that this example is different from the first example in this article, even though it feels identical to `classNameBindings: 'validationResult:is-valid:is-invalid'`.

* In the first example of this article, `classNameBindings` is evaluated in the context of the same component that it's applied to.

* In this example, `classNameBindings` is applied to the `{{textarea}}` component, but it is evaluated in the context of the parent component/controller!



## Passing multiple properties into `classNameBindings` externally seems to be impossible

I assumed this would work, but it doesn't:

```handlebars
{{textarea
  classNameBindings = (array 'validationResult:is-valid:is-invalid')
}}
```

...where `array` is a simple helper that returns its arguments as an array.


I did not find a way to pass more than one property into `classNameBindings`. If you need that, you'll have to subclass the component in question, so that you can apply `classNameBindings` internally, in the component's own JS file.

Luckily, there's a better way.



## Use class instead of classNameBindings in the parent template

The `class` property, unavailable (or at least not documented) inside a component class, can be passed externally. And it allows defining multiple dynamic bindings!

You've probably done that many times:

```handlebars
<div class = "foo {{bar}} {{if baz 'quux' 'zomg'}}">
```

If you pass `class` to a component, you need concatenation:

```handlebars
{{my-component
  class = (concat 'foo ' bar (if baz ' quux' ' zomg'))
}}
```

Note extra spaces in string literals.



## What about attributeBindings?

Ember (Glimmer?) explicitly forbids passing `attributeBindings` from inside a parent tempalte. This will crash your app:

```handlebars
{{my-component
  attributeBindings = "foo"
}}
```

Some Ember addons use a mixin that binds all properties passed from parent template to HTML attributes. With such a mixin, you could do this:

```handlebars
{{my-component
  disabled = isDisabled
  data-foo = "bar"
}}
```

Here's how a private mixin `dynamic-attribute-bindings` from `ember-one-way-controls`[https://github.com/DockYard/ember-one-way-controls/blob/v3.0.1/addon/-private/dynamic-attribute-bindings.js](looks like):

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

Note that this approach uses a blacklist. I. e. it would process any attribute that is not mentioned in `NON_ATTRIBUTE_BOUND_PROPS` (which is a concatenated property: if you try to override it, you will instead append to it).

You can adjust this logic to use a whitelist instead.



## Know more? Share!

Kudos to Ricardo Mendes ([@locks](https://github.com/locks)) for kind explanations of how `classNameBindings` work.

If you see an inaccuracy or have a better explanation of the matter, don't hesitate to share in the comments!
