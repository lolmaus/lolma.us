# lolma-us

This README outlines the details of collaborating on this Ember application.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with NPM)
* [Yarn](https://yarnpkg.com/)
* [Ember CLI](https://ember-cli.com/)
* [Chrome](https://www.google.com/chrome/)



## Installation for local development

* `git clone <repository-url>` this repository
* `cd lolma-us`
* `yarn install`



## Running / Development

1. Create [a GitHub app](https://github.com/settings/applications/new).

    The callback URL should be `http://localhost:8082/torii/redirect.html`.

2. Set up [Gatekeeper](https://github.com/prose/gatekeeper#deploy-on-heroku).

3. Set up an `.env-localhost-4200` file. Example:

    ```js
    LMS_GITHUB_CLIENT_ID = <your GitHub app client id>
    LMS_HOST             = http://localhost:4200
    LMS_GATEKEEPER_URL   = https://<your Heroku app id>.herokuapp.com

4. Run:

        FASTBOOT_DISABLED=true ember s

5. Visit your app at [http://localhost:4200](http://localhost:4200).



## Building to try static FastBoot locally:

1. Create [a GitHub app](https://github.com/settings/applications/new).

    The callback URL should be `http://localhost:8082/torii/redirect.html`.

2. Set up [Gatekeeper](https://github.com/prose/gatekeeper#deploy-on-heroku).

3. Set up an `.env-localhost-8082` file. Example:

    ```js
    LMS_GITHUB_CLIENT_ID = <your GitHub app client id>
    LMS_HOST             = http://localhost:8082
    LMS_GATEKEEPER_URL   = https://<your Heroku app id>.herokuapp.com
    ```

4. Run:

    LMS_DEPLOY_TARGET=prod ember b -prod
    
5. Run a static server:
    
        http-server dist/ -p 8082 --cors

    If you run into a CORS issue, clear/disable your browser's cache.

6. Visit your app at [http://localhost:8082](http://localhost:8082).



## Building for production

1. Create [a GitHub app](https://github.com/settings/applications/new).

    The callback URL should be `http://lolma.us/torii/redirect.html`.

2. Set up [Gatekeeper](https://github.com/prose/gatekeeper#deploy-on-heroku).

3. Set up an `.env-prod` file. Example:

    ```js
    LMS_GITHUB_CLIENT_ID = <your GitHub app client id>
    LMS_HOST             = http://lolma.us
    LMS_GATEKEEPER_URL   = https://<your Heroku app id>.herokuapp.com
    ```
    
4. Pray and run:

    LMS_DEPLOY_TARGET=prod ember deploy prod



## Running development server

1. Run a build before you run the server (see above).

2. Run a content server in background on port `8081`:

    http-server dist/ -p 8081 --cors

3. Finally, run `ember s` in another terminal.



### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
