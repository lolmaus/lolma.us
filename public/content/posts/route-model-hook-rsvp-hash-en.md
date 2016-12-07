---
id: route-model-hook-rsvp-hash-en
title: Do return an `RSVP.hash()` from your routes' `model` hooks!
summary: It's a popular opinion that returning a hash from the `model` hook is a bad practice. I believe it's not. I always return a hash, following a witty pattern, and find it very beneficial.
date: "2016-12-08"
---

## Why should you avoid returning a hash?

I never supported this idea, so let's see what a smarter Ember dev thinks.

Sam Selikoff, the heroic author of [Mirage](http://www.ember-cli-mirage.com/), in [a blog post](https://medium.com/@sam.selikoff/because-returning-a-single-domain-object-from-the-route-is-the-ember-pattern-the-very-name-of-the-94c4abf4ad58#.b6gzydbvt) supports never returning a hash from the `model` hook.

  Though I definitely follow Sam's example on Ember patterns, I dare to disagree with this particular piece of advice.

Here are some of his points. Make sure to read the original post!

*   The hook's name, `model`, implies that a single entity should be returned from the hook.
*   A necessity to return more than one entity is an indication of bad [ERM](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model) design.
*   If you need to return several models, you should refactor by introducing a junction model with relationships that represent a combination of the models you need, and return that junction model from the route.
*   If you can't unite unrelated models under a single entity, you shouldn't load all of them in the route. Instead, load the most important one from the route and load the rest from the controller after the initial render.
*   In Rails, controllers should instantiate only one object.

Let's see.

The Rails isn't really something one should Compare Ember with. Though both are considered MVC frameworks, their architecture is very different. Rails doesn't have a "Route" entity at all, and for a specific REST call it always calls exactly one controller, even if the URL represents a nested resource. In Ember, Routes are entities that a responsible for data loading and are called in a chain.

As for the name of the hook, `model` and not `modelAndEtc`, it's not really a decisive factor to me. First of all, in web dev, the word `model` is used in a very wide meaning. In the context of a data layer such as Ember Data, it typically means a class representing a resource that is used to instantiate individual records of that resource. But outside the data layer context, a model is simply something that represents your data, and it can be anything — from a string to a complex, arbitrarily defined JSON-like structure.

Also, Sam is not against returning an array from the `model` hook, even though its name isn't `models`.

Finally, I find the recommendation to refactor the ERM in such a way, that every route can be represented with a single entity, to be idealistic and naive.

This assumption is simply not always true. Quite often you do have routes that display several unrelated, yet equally important entities. Displaying the route without some of them makes no business-logical sense, and you can't reasonably unite them under a single junction entity.

Even if introducing a junction entity makes sense, it can be impossible to do it on the backend. For example because you don't have access to and/or authority over the backend codebase.

You could introduce a frontend-only junction model. In certain complicated cases, this is the optimal solution, and I did follow this path with much success. But the cost is high: your frontend and backend ERMs diverge. I believe, doing that simply to avoid returning a hash is absolutely unreasonable.

Even if you can synchronize the ERM update both on the frontend and the backend, it's still a terribly huge stretch for avoiding one trivial pattern.

But most importantly, Sam doesn't point out any *practical* disadvantage of returning a hash. That's because there are none! But there are benefits.



## I always return `RSVP.hash()` from every route, with a twist

Let me explain how I do it and then we'll see what the advantages are.

Every route's `model` hook should return an `RSVP.hash()`. Even if it loads only one entity, put it into a property on the hash.


But there's an important twist! **Every model hash should extend its parent hash**. Well, except for topmost routes, of course.

Here's how my typical model hook looks like:

```js
// posts route
model (}) {
  const store = this.get('store')
  
  return RSVP.hash({
    posts: store.findAll('post'),
  })
}
```

```js
// posts.post route
{
  model ({postId}) {
    const store = this.get('store')
    const model = this.modelFor('posts')
    
    return RSVP.hash({
      ...model,
      currentPost: store.peekRecord('post', postId),
    })
  }
}
```

The `...` is a [spread](https://www.google.ru/search?q=es2015+spread+operator) operator, short for `Ember.merge` and `Object.assign`.

The `posts.post` route will end up with a model like this:

```js
{
  posts: [post1, post2, post3],
  currentPost: post2
}
```

This makes the content of the `model` property consistent across all your templates



## Self-explanatory code

One of Sam's arguments I didn't mention earlier is that doing `model.posts` is worse than just `model`. I disagree.

When I see `{{#each model as |item|}}`, it's always puzzling and frustrating. Seeing `model.posts`, on the other hand, is self explanatory.



## Consistent access to available data

With this approach, every model property always has all data that has been loaded in any of the parent routes in the hierarchy.

You can access that data directly in any template, without having to manually throw this data through by using smelly patterns like `modelFor` in `setupController`, unnecessary services or junction models.

Say, on an individual post route I would like to show links to previous and next posts. In order to acheive this this, here's what I'm not gonna do:

*    I don't have to introduce `previousPost` and `nextPost` entities on the post model.
*    I don't need to introduce a junction model that represents a post with its adjacent posts.
*    I don't have to do `store.peekRecord` on the controller/template level.
*    I don't need to use `setupController`. I find `setupController` to be a bad practice that abandons declarative computed properties in favor of ugly imperative code that increases tight coupling. There's literally only one place where you need `setupController`: to pass an error into the `error` substate.
*    I don't have to introduce a service that retrieves adjacent posts for a given post.

**All I need to do is to access `model.posts`! I don't even care in which of the parent routes it was loaded.**

> Note that I'm not encouraging you to preload all posts in the `posts` route. In the simplest case, it's more efficient to load all posts in `posts.index`. This way, the user won't have to download all posts if they only came to see a specific one at `posts.posts`.
> 
> But it's a very common situation that you need to load all posts in `posts` for other reasons. For example, you want to display a tag cloud, but your backend doesn't provide a dedicated tags API: tags are simply an attribute on the post model. Or you want to display a list of recent posts in the sidebar but your API can't filter by date and limit amount.
> 
> In such cases, you have posts preloaded anyway. Why not reuse them effectively?


## Encourages you to rely on the efficiency of computed properties

So I want to display links to previous and next posts.

Knowing that all posts are available as `model.posts` in any controller, I can just toss a few computed properties where I need them:

```js
import {sortBy}            from 'ember-computed'
import sum                 from 'ember-cpm/macros/sum'
import indexOf             from 'make/your/own/macro'
import getFromArrayByIndex from 'it-s/super/easy'

{
  sortedPosts:       sortBy('model.posts', 'createdAt'),
  currentPostIndex:  indexOf('sortedPosts', 'model.currentPost'),
  nextPostIndex:     sum('currentPostIndex', 1),
  previousPostIndex: sum('currentPostIndex', -1),
  nextPost:          getFromArrayByIndex('sortedPosts', 'nextPostIndex'),
  previousPost:      getFromArrayByIndex('sortedPosts', 'previousPostIndex'),
}
```

```handlebars
{{#if nextPost}}
  {{link-to (concat '← ' nextPost.title) 'posts.post' nextPost.id}}
{{/if}}

{{#if previousPost}}
  {{link-to (concat previousPost.title ' →') 'posts.post' previousPost.id}}
{{/if}}
```

This code is declarative, as bug-proof as it can be and easy to understand from first glance.

It's also performant: controllers cache CP values, and once you leave and revisit the route, the controller won't have to recalculate those values.



## Lets you preload data nicely

If you need to preload some related records, you can do it in a very readable way:

```js
{
  model ({postId}) {
    const store = this.get('store')
    const model = this.modelFor('posts')
    
    return RSVP
      .hash({
        ...model,
        currentPost: store.peekRecord('post', postId),
      })
      
      // When we have the post, we can fetch its comments
      .then(model => RSVP.hash({
        ...model,
        comments: model.currentPost.get('comments'),
      }))
      
      // And finally we're able to fetch comment authors:
      .then(model => {
        const commentAuthorIds =
          model
            .currentPost
            .get('comments')
            .map(c => c.belongsTo('author').id())
            .join(',')
      
        return RSVP.hash({
          ...model,
          commentAuthors: store.query('user', {'filter[ids]': commentAuthorIds})
        })
      })
  }
}
```

One of Sam's concerns is that this approach prevents devs from traversing the model graph.

I fully agree with Sam that in most cases you should traverse the model graph via a chain like `model.currentPost.comments[n].author` rather than retrieve current author's comment from `model.commentAuthors`.

But the matter is that though you do have `model.commentAuthors` available, you still can access comment authors via the chain. `model.commentAuthors` was merely a self-explanatory way to preload data.



## ESLint to the rescue

One problem with this approach is that JSHint freaks out at the `...` spread operator.

It's not a problem of the approach itself but rather a matter of relying on outdated tooling.

`ember install ember-eslint` resolves this problem for good. You shouldn't avoid the powerful spread operator only because JSHint sucks at ES2015.



