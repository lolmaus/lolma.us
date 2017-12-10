# lolma-us

This README outlines the details of collaborating on this Ember application.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with NPM)
* [Bower](https://bower.io/)
* [Yarn](https://yarnpkg.com/)
* [Ember CLI](https://ember-cli.com/)
* [Chrome](https://www.google.com/chrome/)

## Installation

* `git clone <repository-url>` this repository
* `cd lolma-us`
* `npm install`
* `bower install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

## Building

1. Set up an `.env-something` file. Example:

    ```js
    LMS_GITHUB_CLIENT_ID = <github application key>
    LMS_HOST             = http://localhost:8082
    LMS_GATEKEEPER_URL   = https://lolma-us-dev-8082.herokuapp.com
    ```

2. Run:

    LMS_DEPLOY_TARGET=something ember b -prod

3. Try out your app with:

    http-server dist/staticboot/ -p 8082 --cors

If you run into a CORS issue, clear/disable your browser's cache.



### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
