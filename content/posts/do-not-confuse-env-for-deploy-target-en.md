---
id: do-not-confuse-env-for-deploy-target-en
title: Do not confuse environment for deploy target
summary: Most frameworks have a concept of *environment*. Many developers are misusing it as a deploy target.
created: 2017-02-18
updated: 2017-12-24
---

<div class="exclamation"></div>

> This article was originally posted on Deveo blog.
> 
> When Deveo was acquired by Perforce, Deveo blog was turned down.

I'm seeing the term **environment** used as a synonym of **deploy target** all the time. I believe, it causes a lot of confusion, and I would like clear it up.

This article is written with the **EmberJS** frontend framework in mind, but the idea is applicable to any other web framework, both frontend and backend.



## The term Environment is too vague

There are many articles on the web that may seem to contradict to what I'm gonna say, especially if you skim them without giving them deep consideration. Those articles have been frustrating to me for a long time, until I figured that the problem is that terminology is confusing.

In **EmberJS** and many other web frameworks the term **environment** is used in a narrow meaning, and I'm gonna use this very meaning below. **Environment** is a collection of parameters that configure how your wep app is built and run, such as:

*   code minification,
*   asset fingerprinting/cache busting,
*   source map generation,
*   various debugging tools,
*   testing,
*   applying code coverage markers,
*   removing test selectors from HTML.

There is another category of parameters, that is commonly referenced as **environment**. I believe that's a terrible mistake, and the second category must be distinguished from **environment**.

I call it **deploy target**. It includes the following params:

*   API URLs,
*   CDN URLs,
*   CSP/CORS configuration,
*   API keys.



## Why is mixing these categories a problem?

Many developers put those two categories of params into one pile and make them depend on the **environment** variable, which in most frameworks can have one of three values: `development`, `production` and `test`.

As a result, the app essentially has only two modes:
* production build to production server,
* development build to development server.

A necessity to deploy a development build to a production server is not rare. You typically need that to debug a problem that only manifestates on the server and can't be reproduced locally.

The opposite is also sometimes necessary: to make a production build against a local server. It can help you to benchmark your app's performance or to debug a problem with minification/fingerprinting.

When you have your **environment** and **deploy target** hard-wired, the only way to decouple them is to edit your configuration files by hand, make the unusual build, then undo your changes and make sure you don't accidentally commit them.

The worst part is that API keys are typically stored in your VCS, which is a security issue.



## The right way to do it

I recommend you to use *dotenv* files.

Dotenv files are configuration files with names that start with `.env-` prefix. They store environment variable definitions as key=value pairs, one per line:
    
```
FOO=bar
BAZ=quux
```

Your app will read one of those files during build and use its values.

The phrase "environment variables" contributes to confusion, be careful. "Environment variables" are variables that you can pass from command line.

Here's what you should do:

1. Remove all **deploy target** parameters from your code.
2. Move them into dotenv files. Make one dotnev file per **deploy target**. For example, `.env-production`, `.env-staging`, `.env-sandbox`, `.env-local`, `.env-mock`, etc. You can have as many as you need, not just production and development.
3. It is crucial that you gitigonre your dotenv files, so that your API keys do not get exposed through version control.
4. If you're using CI, you can copy variables from your dotenv files to your CI's online configuration. For example, the corresponding settings section in CodeShip is called "deployment pipelines".
5. Set up your app to accept a **deploy target** param, read the corresponding dotenv file and use values inside it. Most platforms have a `dotenv` library to do that.

You're now able to select a **deploy target** separately from **environment**.

For example, when I need to run a produciton build against a local server I can do:

    DEPLOY_TARGET=local ember serve --environment=production

Of course, you can configure your app in such a way that a certain default **deploy target** is automatically selected for every **environment**. This will let you avoid redundancy in most common combinations.

You may object: we've come a full circle and now we are where we started: **envrionment** and **deploy target** are coupled. What's the point?

Yes, it is like that by default: your app will use development environment for local builds and production environment for deployments to production servers. But now you can override them and use any combination of **environments** and **deploy tarets** — without a need to modify your code and then roll back.



### How to configure dotenv in Ember

The [dotenv](https://www.npmjs.com/package/dotenv) npm library can be used in Ember directly. But if you need to access your **deploy target** params both in `ember-cli-build.js` and `config/environment.js`, or in FastBoot, then you should use the [ember-cli-dotenv](https://github.com/fivetanley/ember-cli-dotenv) addon.

Create `.env-` files in the root folder of your Ember CLI project, one per each backend you're using, including local and mock servers if you use them:

    .env-production
    .env-staging
    .env-sandbox
    .env-local
    .env-mock

A top-notch technique is to give your servers personal names. Using `.env-linode1` instead of `.env-production` will make things more clear.

Put **deploy target** configuration into each file like this:

    MYAPP_BACKEND_API_URL=https://bravo.horns-and-hooves.com/api
    MYAPP_BACKEND_API_VERSION=v18
    MYAPP_IMAGES_CDN_URL=http://horns-and-hooves.cloudfront.net/bravo/images
    MYAPP_GITHUB_API_KEY=jFViG9kZtY4NAJA8I65s

Some of params may be shared across servers, that's fine.

You are recommended to prefix your variable names with your app name in order to prevent collisions with external env vars that you may also need.

No we need to teach `ember-cli-dotenv` load a specific dotenv file depending on our needs. Use this trick in your `config/dotenv.js` file:

```javascript
const fs = require('fs')

const environment   = process.env.EMBER_ENV || 'development'
const defaultTarget = environment === 'production' ? 'production' : 'localhost-4200'
const target        = process.env.DEPLOY_TARGET || defaultTarget
const dotEnvFile    = `./.env-${target}`

if (fs.existsSync(dotEnvFile)) console.info(`using dotenv file: ${dotEnvFile}`)
else console.warn(`dot-env file not found: ${dotEnvFile}, assuming env vars are passed manually`)



module.exports = function (env) {
  return {
    clientAllowedKeys : [
      'MYAPP_BACKEND_API_URL',
      'MYAPP_BACKEND_API_VERSION',
      'MYAPP_IMAGES_CDN_URL',
      'MYAPP_GITHUB_API_KEY',
    ],
    path : dotEnvFile,
  }
}
```

This will make the params from a given dotenv-file appear in the `process.env` hash, which in turn is available in `config/environment.js` and `ember-cli-build.js`. Use it like this:

```js
{
  gitHubApiKey: process.env.MYAPP_GITHUB_API_KEY
}
```

<div class="exclamation"></div>

> Instead of accessing the `config/environment.js` in your app directly, create a `config` Ember service that will proxy the values from `config/environment.js`. Not only this will improve your app's architecture, it will also allow you have global computed properties derived from values read from `config/environment.js`.

The above code will use `production` **deploy target** in the `production` **environment** and `localhost-4200` in `development`. You should adjust **deploy target** names used in the code by default.

```sh
ember s -prod   # uses `production` environment with `production` deploy target
ember s         # uses `development` environment with `localhost-4200` deploy target
```

Here's how you can tell which dotenv file to use:

```sh
DEPLOY_TARGET=localhost-4200 ember s -prod   # uses `production` environment with `localhost-4200` deploy target
DEPLOY_TARGET=production ember s             # uses `development` environment with `production` deploy target
```




## Together with ember-cli-deploy

`ember-cli-deploy` [has built-in support for dotenv files](http://ember-cli-deploy.com/docs/v1.0.x/using-env-for-secrets/), but they're used only for `ember deploy` commands, whereas `ember-cli-dotenv` can be used both with `ember deploy` and default commands like `ember serve`, `ember build`, `ember test`, etc.

There are a number of gotchas you have to be aware of when you use `ember-cli-dotenv` together with `ember-cli-deploy`.

First of all, `ember-cli-deploy` docs use the phrase "build environment" as a synonym for **deploy targets**, which contributes to confusion.

Secondly, the `config/deploy.js` configuration file lets you define configuration based on **deploy target**. Rename **deploy target** names in the file to match the ones in your dotenv file names.

Thirdly, don't use short names like `dev` and `prod`. Use full names `development` and `production` or, even better, use unique names for your servers.

Fourthly, mind that `ember-cli-deploy` also uses the `DEPLOY_TARGET` env var. But for some reason it can't be used like this:

    DEPLOY_TARGET=production ember deploy
    
Instead, you're supposed to write

    ember deploy production
    
The trouble is that the `config/dotenv.js` files kicks in earlier than the `ember deploy production` command sets **environment** to `production` and assigns it to the `DEPLOY_TARGET` env var.

 One solution is to pass the `DEPLOY_TARGET` variable explicitly for your `config/dotenv.js` to use:

    DEPLOY_TARGET=production ember deploy production


 But this command is quite bulky. You can avoid the redundancy by teaching your `config/dotenv.js` to be aware of the `ember deploy production` command:

```js
const fs = require('fs')

function getDeployTarget () {
  return process.env.DEPLOY_TARGET || getDefaultDeployTarget()
}

function getDefaultDeployTarget () {
  const environment =
    process.env.EMBER_ENV
    || deployEnv()
    || 'development'

  return environment === 'production' ? 'production' : 'localhost-4200'
}

function deployEnv () {
  if (process.argv[2] === 'deploy' && process.argv[3] === 'prod') {
    throw new Error("Command `ember deploy prod` is not supported. Please use `ember deploy production`.")
  } else if (process.argv[2] === 'deploy' && process.argv[3] === 'production') {
    return 'production'
  }
}



const dotEnvFile   = `./.env-${getDeployTarget()}`

if (fs.existsSync(dotEnvFile)) console.info(`Using dotenv file: ${dotEnvFile}`)
else console.warn(`dot-env file not found: ${dotEnvFile}, assuming env vars are passed manually`)



module.exports = function (env) {
  return {
    clientAllowedKeys : [
      'MYAPP_BACKEND_API_URL',
      'MYAPP_BACKEND_API_VERSION',
      'MYAPP_IMAGES_CDN_URL',
      'MYAPP_GITHUB_API_KEY',
    ],
    path : dotEnvFile,
  }
}
```

As a result, the `ember deploy production` command will use the `.env-production` dotenv file and set the **environment** to `production`.

When you need to deploy a development build (e. g. with no minification) to production, use this command:

    EMBER_ENV=development ember deploy production



## Your opinion?

Don't hesitate to share what you have to say in the comments!

