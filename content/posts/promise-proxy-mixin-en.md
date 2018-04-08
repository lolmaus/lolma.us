---
id: promise-proxy-mixin-en
title: "PromiseProxyMixin: pure Ember alternative to ember-concurrency"
summary: ember-concurrency is an extremely powerful and useful addon. Yet, if your only use case is fetching or sending data, there's a lighweight alternative.
created: 2017-03-07
updated: 2018-01-05
proficiency: beginner
---

<div class="exclamation"></div>

> This article was originally posted on Deveo blog.
> 
> When Deveo was acquired by Perforce, Deveo blog was turned down.



[ember-concurrency](http://ember-concurrency.com) is an exceptionally powerful add-on with numerous use cases.

The most common use case though is simply fetching or submitting data. You may be hesitant to include `ember-concurrency` into your app only for this use case.

The matter is that Ember has all the necessary pieces included for implementing this kind of data fetching with simplicity and efficiency while staying true to the Ember way.



## Example use case

Let me demonstrate on a simple example. We are going to fetch the remaining number of available requests from GitHub API:

    GET http://api.github.com/rate_limit

I've chosen this particular API endpoint because it's the only one that GitHub doesn't rate-limit. :trollface:

Let's implement a data fetching method:

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

I'm using [ember-fetch](https://github.com/ember-cli/ember-fetch), but it can be anything that returns a promise, for example, the [ember-ajax](https://github.com/ember-cli/ember-ajax) service.

And it can happen not only in a controller, but in any other Ember entity: component, service, model, etc.



## Enter `PromiseProxyMixin`

You've probably heard an opinion that returning a promise from a computed property is a bad idea. Well, with [PromiseProxyMixin](https://emberjs.com/api/ember/2.18/classes/PromiseProxyMixin) that's not true.

Let's create an Ember Object enhanced with `PromiseProxyMixin`. You can do this on the root level of your module:

```js
import EmberObject from '@ember/object'
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin'

const PromiseObject = EmberObject.extend(PromiseProxyMixin);
```

Now we can wrap the promise into `PromiseObject`. Make sure to create two distinct computed properties (CPs):

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

Note the `promise &&` part. We don't want the promise proxy to be created when the promise does not exist because it would crash in that case.



## Accessing the content of a promise

The API endpoint we're accessing returns the data in this format (fragment shown):

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

This hash will become available in the template as `gitHubRateProxy.content`. You can work with this property normally, as shown below:

```js
  gitHubRate:          reads('gitHubRateProxy.content'),
  gitHubRateRemaining: reads('gitHubRate.resources.core.remaining'),
  gitHubRateLimit:     reads('gitHubRate.resources.core.limit'),
```

While the promise is not resolved, those properties will be `undefined`. Make sure to account for that when you use them downstream:

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

Now you can simply use these properties in your template!

```handlebars
Your GitHub rate limit: {{gitHubRateRemaining}} ({{gitHubRatePercentage}})
```



## How it works

Initially, the `gitHubRatePromise` CP is not consumed, and the request isn't made.

When the template is rendered, the `gitHubRateRemaining` computed property is accessed. This CP depends on `gitHubRateProxy`. The `gitHubRateProxy` in turn reads `gitHubRatePromise`.

When the `gitHubRatePromise` computed property is accessed for the first time, it calls the data fetching method and returns the promise.

This promise is cached, so when it is accessed again, the computed property returns the same promise, and duplicate requests are not performed. Essentially, it implements a pattern that `ember-concurrency` calls `drop`!

The promise is wrapped into the `PromiseObject` available as `gitHubRateProxy`. When the promise resolves, its return value becomes available as `gitHubRateProxy.content`.

Note that this approach is declarative. I. e. you don't have to do this:

```js
didInsertElement () {
  this._super()
  this.get('fetchGitHubRateTask').perform()
}
```



## Accounting for a pending promise

Before the promise is resolved, `gitHubRateProxy.content` will be `undefined`. This means that while the promise is pending, the user will see nothing. Let's fix that.

`PromiseProxyMixin` exposes the `gitHubRateProxy.isPending` property. We can read it in our template:

```handlebars
{{#if gitHubRateProxy.isPending}}

  Retrieving GitHub rate limit...

{{else}}

  Your GitHub rate limit: {{gitHubRateRemaining}} ({{gitHubRatePercentage}})
  
{{/if}}
```

Doing this feels quite natural. Turns out, returning promises from computed properties isn't that bad! :wink:



## Accounting for a rejected promise

You might have already noticed a problem in this example: if a promise is rejected (due to a network hiccup, for example), it's rejected value will be cached forever. This is where `ember-concurrency` shines: it lets you restart a rejected task with very little boilerplate code.

We can restart our promise with a few extra lines of code. The trick is to overwrite the `gitHubRatePromise` computed property with a static promise:

```js
  actions: {
    refetchGitHubRate () {
      this.set('gitHubRatePromise', this._fetchGitHubRate());
    }
  },
```

Calling this action will start a new network request, put its promise into `gitHubRatePromise` and force all dependent computed properties to recalculate! `gitHubRateProxy.isRejected` will be true when the promise is rejected. `gitHubRateProxy.reason` will contain the rejection message. Let's do it:

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


## Demo

See the complete code sample and try it in action [on Ember Twiddle](https://ember-twiddle.com/f645d337712394d2ebdf0a7ddd061897?numColumns=2&openFiles=controllers.application.js%2Ctemplates.application.hbs):
<iframe src="https://ember-twiddle.com/f645d337712394d2ebdf0a7ddd061897?fullScreen=true" style="width: 100%; height: 500px; border: 2px solid biege;"></iframe><br>

[Here](https://ember-twiddle.com/bf8285db75b057eb99aea8cb0e2791ab?numColumns=2&openFiles=controllers.application.js%2Ctemplates.application.hbs) you can find the `ember-concurrency` variant for comparison.



## Keeping the logic on a service for reusability

If you have the described logic on a component and render the component in two distinct routes, it will redownload the data every time the user switches routes.

This is likely not desirable. Instead, you want the response to be cached globally, it should be redownloaded only when explicitly told to.

The solution to this is simple: move the logic into a service. It's very convenient to subclass `ember-ajax` and enhance it with custom methods and computed properties.



## `Ember.ObjectProxy` is not necessary

Note that official [PromiseProxyMixin](https://emberjs.com/api/ember/2.18/classes/PromiseProxyMixin) docs suggest using `Ember.ObjectProxy`. However, it is doing some black magic with the only purpose of which is to shorten this path:

    gitHubRateProxy.content.resources.core.remaining

by removing the `.content` segment so that it looks like this:

    gitHubRateProxy.resources.core.remaining

Naturally, this black magic doesn't work for arrays. For arrays, you have to use `Ember.ArrayProxy` which of course doesn't work with objects. And if your promise returns a class instance rather than a hash (POJO), you can use neither of them.

`Ember.Object` is universal. Having this extra `.content` segment is a tiny price to pay for the straightforwardness it offers. I believe, `ObjectProxy` and `ArrayProxy` are the remnants of the bygone era of `ObjectController` and `ArrayController`.



## Neither are `ember-deferred-content` and `ember-async-button`

These two addons approach promise wrapping on template level. They offer funky template APIs without offering anything that the described approach does not offer. 

Compare these:

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

Note how `ember-deferred-content` forces you to calculate percentage on the template level.



## I'm not advocating against `ember-concurrency`

The main purpose of this article is to show you a pattern and make you give it a little thought. The pattern is fully legit and I'm using it whenever I don't feel like including `ember-concurrency` into my project.

There are at least two reasons to do this:

* you care for your distribution size too much, and
* you want to keep it simple and avoid extra layers of unnecessary abstraction and complexity

If you're already familiar with `ember-concurrency` and have it included in your project, there's no reason not to employ it for this use case. It may save you some typing:

```js
gitHubRateTask: task(function * () {
  return yield this._fetchGitHubRate();
}).restartable().on('didInsertElement')

gitHubRate:          reads('gitHubRateTask.last.value'),
gitHubRateRemaining: reads('gitHubRate.resources.core.remaining'),
gitHubRateLimit:     reads('gitHubRate.resources.core.limit'),

// If we don't do this, the request will not be made. Smells imperative. :(
didInsertElement () {
  this._super()
  this.get('fetchGitHubRateTask').perform()
}
```

[Here](https://ember-twiddle.com/bf8285db75b057eb99aea8cb0e2791ab?numColumns=2&openFiles=controllers.application.js%2Ctemplates.application.hbs)'s the link to th full `ember-concurrency` example again.



## Accessing the previous response after the request is repeated and fails

Consider this use case. We're polling the backend every second and we want the last available result to be displayed at all times.

`ember-concurrency` offers access to the last resolution and rejection values even after the task has been restarted:

```handlebars
{{gitHubRateTask.lastSuccessful.value}}
```

If we do the same with the `PromiseProxyMixin` approach, the value on the page will be flashing every second. This is because the promise gets overwritten every second, and the previous resolution value becomes unavailable.

A quick solution would be to add `.then(result => this.set('result', result))` to the promise, so that the resolved value gets extracted from the promise and stored separately.

This is a valid solution, but I don't like it for its imperativeness. Instead, consider this CP macro:

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

It can be used like this: 

```js
gitHubRate:          cachingMacro('gitHubRateProxy.content'),
gitHubRateRemaining: reads('gitHubRate.resources.core.remaining'),
gitHubRateLimit:     reads('gitHubRate.resources.core.limit'),
```

Now, when the promise is overwritten with another promise that rejects, `gitHubRate` will still contain the resolved value of the first promise.

Or you can use `ember-concurrency` after all. :grimacing:



## Tell me what you think

Use the comments below to share your impressions, objections, and ideas. The most valuable part of an article is always the discussion that follows!