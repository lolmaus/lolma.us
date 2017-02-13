---
id: route-model-hook-rsvp-hash-en
title: Do return an `RSVP.hash()` from your routes' `model` hooks!
summary: It's a relatively widespread opinion that returning a hash from the `model` hook is a bad practice. I believe it's not! I always return a hash, following a witty pattern, and find it very beneficial.
date: 2016-12-08
---



## Why is it considered a bad practice?

I've never thought it's a bad thing in the first place, so let's see what a smarter Ember dev thinks.

Sam Selikoff, the heroic author of [Mirage](http://www.ember-cli-mirage.com/), in [his blog post](https://medium.com/@sam.selikoff/because-returning-a-single-domain-object-from-the-route-is-the-ember-pattern-the-very-name-of-the-94c4abf4ad58#.b6gzydbvt) supports the idea of never returning a hash from the `model` hook.

Though I definitely follow Sam's example on Ember patterns, I dare to disagree with this particular case.

Here are some of his points summarized by me. Make sure to read the original post!

*   The hook's name, `model`, implies that a single entity should be returned from it.
*   A necessity to return more than one entity is an indication of bad [ERM](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model) design.
*   If you need to return several different models, you should refactor by introducing a junction model with relationships that represent a combination of the models you need, and return that junction model from the route.
*   If the models are so independent that it's inappropriate to unite them under a single entity, you shouldn't load all of them in the route. Instead, load the most important one from the route and load the rest from the controller/components after the initial render.
*   In Rails, controllers should instantiate only one object.

Let's see.

> The hook's name, `model`, implies that a single entity should be returned from the hook.

The name of the hook isn't really a decisive factor to me. First of all, in web dev, the word `model` is used in a very wide meaning. In the context of MVC's model layer such as Ember Data, "model" typically means a class representing a resource and is used to instantiate individual records of that resource. But outside the model layer context, a "model" is simply something that represents your data, and it can be anything — from a string to a complex, arbitrarily defined JSON-like structure.

Also, Sam is not against returning an array from the `model` hook, even though its name isn't `models`.

> If you need to return several models, you should refactor by introducing a junction model.
>
> If you can't unite unrelated models under a single entity, you shouldn't load all of them in the route.

I find the recommendation to refactor the ERM in such a way, that every route can be represented with a single entity, to be idealistic and naive: it is simply not always possible!

Quite often you do have routes that display several unrelated, yet equally important entities. Displaying the route without some of them makes no business-logical sense, yet you can't reasonably unite them under a single junction entity.

Even if introducing a junction entity makes sense, updating the backend can be too hard or even impossible, for example, if you don't have access to and/or authority over the backend codebase.

You could introduce a frontend-only junction model. In certain complicated cases, this is the optimal solution, and I did follow this path when it was appropriate ([example](http://intercom.lolma.us/dublin/)). But the cost is high: your frontend and backend ERMs diverge. I believe, doing that simply to avoid returning a hash is absolutely unreasonable.

Even if you can synchronize the ERM refactor of the frontend and the backend, it's still a terribly huge stretch for avoiding one trivial pattern.

> In Rails, controllers should instantiate only one object.

Rails isn't really something one should Compare Ember with. Though both are considered MVC frameworks, their architecture is very different. Rails doesn't have a "Route" class at all, and for a specific REST call the router always calls exactly one controller, even if the URL represents a nested resource. In Ember, Routes are entities that a responsible for data loading and are called in a chain.

But most importantly, Sam doesn't point out any *practical* disadvantage of returning a hash. That's because there are none! But there are benefits.



## The best way to return a hash from the `model` hook

Let me explain how I do it and then we'll see what the advantages are.

**Every route's `model` hook should return an `RSVP.hash()`. Even if it loads only one entity, put it into a property on the hash.**

**The trick is that *every model hash should extend its parent hash*.** Except for topmost routes which have no parent model, of course.

Here's how my typical model hooks look like:

```js
// posts route
model () {
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

Now let's how it makes your codebase awesome!



## Self-explanatory code

One of Sam's arguments I didn't mention earlier is that accessing `model.posts` in a template is worse than just `model`. I disagree.

When I see `model` used in a template, it's always puzzling and frustrating. Seeing `model.posts`, on the other hand, is self-explanatory.



## Consistent access to available data across all templates

With this approach, the `model` property in every controller always contains all data that has been loaded in all of the parent routes in the hierarchy.

You can access that data in any template directly, without having to manually pass this data through by using hairy patterns like `modelFor` in `setupController`, unnecessary services or junction models.

Say, on an individual post route I would like to show links to previous and next posts. Here's what I'm **not** gonna do in order to achieve that:

*    I don't have to introduce `previousPost` and `nextPost` relationships on the `post` model.
*    I don't need to introduce a junction model that represents a post with its adjacent posts.
*    I don't have to run `store.peekRecord` on the controller/component level.
*    I don't need to use `setupController`. I find `setupController` to be a bad practice that abandons declarative computed properties in favor of ugly imperative code that increases tight coupling. There's literally only one place where you need `setupController`: to pass an error into the `error` substate.
*    I don't have to introduce a service that retrieves adjacent posts for a given post.

**All I need to do is to access `model.posts`! I don't even care in which of the parent routes it was loaded.**

<div class="exclamation"></div>

> Note that I'm not encouraging you to preload all posts in the `posts` route. In the simplest case, it's more efficient to load all posts in `posts.index`. This way, the user won't have to download all posts if they only came to see a specific one at `posts.posts`.
> 
> But it's a very common situation that you need to load all records in records in the parent due to other reasons. For example, you want to display a tag cloud, but your backend doesn't provide a dedicated tags API: tags are simply an attribute on the model. Or you want to display a list of recent posts in the sidebar but your API can't filter by date and limit amount, so you have to do it on the client. Or there's simply not that much records of a certain type, so it's both fast and convenient to preload all of them.
> 
> In such cases, you have your records preloaded anyway. So why not reuse them effectively?



## Leveraging the efficiency of computed properties

So I want to display links to previous and next posts.

Knowing that all posts are available as `model.posts` in almost any controller, I can just toss a few computed properties where I need them:

```js
import {sort}              from 'ember-computed'
import sum                 from 'ember-cpm/macros/sum'
import indexOf             from 'make/your/own/macro'
import getFromArrayByIndex from 'it/is/easy/and/fun'

{
  sortOrder:         'createdAd', // assuming it's adjustable by user
  sortedPosts:       sort('model.posts', 'sortOrder'),
  currentPostIndex:  indexOf('sortedPosts', 'model.currentPost'),
  nextPostIndex:     sum('currentPostIndex', 1),
  previousPostIndex: sum('currentPostIndex', -1),
  nextPost:          getFromArrayByIndex('sortedPosts', 'nextPostIndex'),
  previousPost:      getFromArrayByIndex('sortedPosts', 'previousPostIndex'),
}
```

```handlebars
{{#if nextPost}}
  {{link-to (concat '← ' nextPost.title)     'posts.post' nextPost.id}}
{{/if}}

{{#if previousPost}}
  {{link-to (concat previousPost.title ' →') 'posts.post' previousPost.id}}
{{/if}}
```

This code is declarative, as bug-proof as it can be and easy to understand from a single glance.

It's also performant: CP values are cached, and once you leave and revisit the route, the controller/component won't have to recalculate those values. But they'll recalculate automatically if the array of posts changes.



## Preload related data nicely

If you need to preload some related records, you can do it in a very readable way.

In this example, we preload authors of the post and of all its comments:

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
      
      // When we have the post, we're able to fetch its author and comments
      .then(model => RSVP.hash({
        ...model,
        author:   model.currentPost.get('author'),
        comments: model.currentPost.get('comments'),
      }))
      
      // And finally we're able to fetch comment authors:
      .then(model => RSVP.hash({
        ...model,
        commentAuthors: store.query('user', {
          'filter[ids]': this._getCommentAuthorIds(model.comments)
        })
      }))
  },
  
  _getCommentAuthorIds (comments) {
    return comments
      .map(comment => comment.belongsTo('author').id())
      .join(',')
  },
}
```

One of Sam's concerns is that this approach prevents devs from traversing the model graph.

I fully agree that in most cases you should traverse the model graph via a chain like `model.currentPost.comments[n].author` rather than filter current author's comment from `model.commentAuthors`.

But the matter is that though you do have `model.commentAuthors` available, you still can access comment authors via the chain. `model.commentAuthors` was merely a self-explanatory way to preload data, it does not prevent you from using the other way.



## ESLint to the rescue

One problem with this approach is that JSHint freaks out at the `...` spread operator.

It's not a problem of the approach itself but rather a matter of relying on outdated tooling.

`ember install ember-eslint` resolves this problem for good. You shouldn't avoid the powerful spread operator only because JSHint sucks at ES2015.



## Tell me what you think

Please share your opinion on this approach in the comments section below.

Does this approach make your dev life a tad more enjoyable?

What disadvantages does it have? Can they be mitigated or is it wrong in the first place?
