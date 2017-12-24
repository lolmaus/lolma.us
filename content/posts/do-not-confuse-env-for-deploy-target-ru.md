---
id: do-not-confuse-env-for-deploy-target-ru
title: Не путайте environment с deploy target
summary: У большинства фрэймворков есть понятие *environment*. Многие разработчики привязывают к environment параметры развертывания, что неверно. 
created: 2017-02-18
updated: 2017-12-24
---

Недавно я в очередной раз наткнулся на эту проблему и решил написать о ней данную заметку. Пишу с оглядкой на фронтенд-фрэймворк **EmberJS**, но суть применима к любому фронтенд- и бэкенд-фрйэмворку.



## Термин environment слишком размыт

Термин **environment** применяется очень широко, что вызывает путаницу. В интернете есть много статей, которые, если прочитать их поверхностно, противоречат тому, что я хочу посоветовать ниже. Долгое время эти статьи вызывали у меня недоумение. Пораскинув мозгами, я понял, что дело в путаной терминологии.

В **EmberJS** и многих других вэб-фрэймворках понятие **environment** применяется в достаточно узком смысле, и я далее буду придеживаться именно его. **Environment** — это набор параметров, конфигурирующих сборку и запуск вэб-приложения:

*   минификация кода,
*   asset fingerprinting/cache busting,
*   генерация source maps,
*   внедрение различных средств, облегчающих отладку,
*   тестирование,
*   внедрение маркеров для оценки покрытия кода,
*   удаление тестировочных селекторов из HTML.

Но есть и другая группа параметров, которую также принято включать в понятие **environment**. Я считаю, что это большая ошибка, и предлагаю отличать две группы. Вторую группу параметров я называю **deploy target**:

*   адреса API,
*   адреса CDN,
*   настройки CSP (content security policy) и CORS (cross-origin resource sharing),
*   ключи API.



## В чем, собственно, проблема

Многие разработчики сваливают обе группы параметров в одну кучу и привязывают к параметру **environment**, который у большинства фрэймворков может принимать всего три значения: `development`, `production` и `test`.

В результате приложение по сути имеет всего два режима сборки: production-билд, привязанный к production серверу, и development-билд привязанный к локальному серверу или моку (имитации сервера).

Сделать сборку в development-режиме, но привязанную к production серверу, затруднительно: для этого приходится временно редактировать конфиг. А ведь такая сборка может очень выручить, когда нужно отладить пробему, которая проявляется в продакшене, но не воспроизводится локально.

Обратное тоже порой необходимо: сделать сборку для локального сервера, но в production режиме. Это нужно, например, чтобы замерить производительность или чтобы отладить проблему, возникающую во время минификации и фингерпринтинга.

А хуже всего то, что ключи API хранятся прямо в конфиге и попадают в систему контроля версий, что угрожает безопасности вашего сервиса.



## Как надо делать

Я рекомендую использовать так называемые *dotenv*-файлы.

Это конфигурационные файлы, имена которых начинаются с `.env-`. Они содержат определения переменных окружения в виде пар ключ=значение, по одной на строку:
    
```
FOO=bar
BAZ=quux
```

Ваше приложение будет считывать нужный файл во время сборки и использовать соответствующие настройки.

Переменные окружения по-английски называются **environment variables**, что добавляет путаницы, так что будьте внимательны. Переменные окружения — это такие переменные, которые можно передать из командной строки.

Вот, что вы должны сделать:

1.  Удалите параметры группы **deploy target** из конфига приложения.

2.  Вынесите их в dotenv-файлы, по одному для каждого сервера: `.env-production`, `.env-staging`, `.env-sandbox`, `.env-local`, `.env-mock` и т. д. Их может быть столько, сколько вам нужно, а не только production и development.

3.  Обязательно добавьте dotenv-файлы в `.gitignore`, чтобы ключи API не засветились в системе контроля версий.

4.  Если вы используете <abbr title="continuous integration">CI</abbr>, содержимое этих файлов можно скопировать в настройки каждого сервера. На CodeShip, например, соответствующий раздел настроек называется "deployment pipelines".

5.  Настройте приложение так, чтобы при сборке можно было указать, какой **deploy target** использовать. Большинство платформ имеют для этого библиотеку `dotenv`.

Теперь **deploy target** можно выбирать отдельно от **environment**, получая любое нужное вам сочетание **deploy target** и **environment**. Например, я это делаю так:

    DEPLOY_TARGET=local ember serve --environment=production

Разумеется, для удобства вы можете настроить, чтобы для каждого **environment** автоматически использовался определенный **deploy target**, чтобы не приходилось указывать каждый раз.

Внимательный читатель возразит: круг замкнулся, и **environment** снова опеределяет **deploy target**. За что боролись?

По-умолчанию всё останется как было, но у вас теперь появилась возможность в нужный момент вручную задействовать любое сочетание **environment** и **deploy target** — без необходимости редактировать код, а потом откатывать.



## Как использовать dotenv в Ember

Npm-библиотека [dotenv](https://www.npmjs.com/package/dotenv) может использоваться в Ember напрямую. Однако если вам нужно считывать параметры **deploy target** как в `config/environment.js`, так и в `ember-cli-build.js`, либо если вы используете FastBoot, то воспользуйтесь аддоном [ember-cli-dotenv](https://github.com/fivetanley/ember-cli-dotenv).

Создайте в корневой папке вашего Ember-приложения `.env`-файлы, по одному для каждого вашего сервера, включая локальный и мок-сервер, если вы их используете:

    .env-production
    .env-staging
    .env-sandbox
    .env-local
    .env-mock

Особенно круто, если у ваших серверов есть имена собственные. В таком случае используйте эти имена в названиях `.env`-файлов.

В каждом файле храните параметры **deploy target** в таком виде:

    MYAPP_BACKEND_API_URL=https://bravo.horns-and-hooves.com/api
    MYAPP_BACKEND_API_VERSION=v18
    MYAPP_IMAGES_CDN_URL=http://horns-and-hooves.cloudfront.net/bravo/images
    MYAPP_GITHUB_API_KEY=jFViG9kZtY4NAJA8I65s

`MYAPP` — это отсылка к названию вашего приложения. Добавлять его полезно, чтобы не переопределить какую-либо внешнюю переменную, которая может потребоваться и навзание которой может совпадать с одним из ваших.

Теперь нам нужно добиться, чтобы `ember-cli-dotenv` подгружал нужный dotenv-файл. Для этого воспользуйтесь таким трюком в файле `config/environment.js`:

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

Теперь параметры из dotenv-файла попадут в хэш `process.env`, который вы можете использовать в `config/environment.js` и `ember-cli-build.js` следующим образом:

```javascript
{
  gitHubApiKey: process.env.MYAPP_GITHUB_API_KEY
}
```

<div class="exclamation"></div>

> Рекомендую дополнительно создать в вашем Ember-приложении сервис `config`, который будет проксировать настройки из `config/environment.js`. Это дает возможность использовать computed properties для формирования производных параметров, например, добавления версии API в адрес сервера.

По умолчанию, приведенный выше кгод будет использовать **deploy target** `production` в **environment** `production` и `localhost-4200` в `development`. Одредактируйте названия **deploy targets**, используемые в коде, чтобы совпали с вашими.


     ember s -prod   # использует `production` environment с `production` deploy target
     ember s         # использует `development` environment с `localhost-4200` deploy target

Вы можете указать, какой dotenv-файл использовать:

    DEPLOY_TARGET=localhost-4200 ember s -prod   # использует `production` environment с `localhost-4200` deploy target
    DEPLOY_TARGET=production ember s             # использует `development` environment с `production` deploy target


## В сочетании с ember-cli-deploy

`ember-cli-deploy` [имеет встроенную поодержку dotenv-файлов](http://ember-cli-deploy.com/docs/v1.0.x/using-env-for-secrets/), однако они используются только для команд `ember deploy`, в то время как описанный выше способ подходит не только для `ember deploy`, но и для `ember serve`, `ember build`, `ember test` и т. п.

При работе с `ember-cli-deploy` стоит обратить внимание на несколько нюансов.

Во-первых, документация `ember-cli-deploy` использует словосочетание "build environment" в качестве синонима **deploy target**, что добавляет путаницы.

Во-вторых, в конфиге `config/deploy.js` можно настраивать параметры сборки в зависимости от **deploy target**. Обязательно переименуйте **deploy targets** в этом файле, приведя их в соответствие названиям ваших dotenv-файлов.
 
В-третьих, не используйте сокращения `dev` и `prod` вместо `development` и `production`. 

В-четвертых, обратите внимание, что `ember-cli-deploy` также применяет переменную окружения `DEPLOY_TARGET`. Однако она почему-то не используется для конфигурации из командной строки.

Использовать ее так нельзя:

    DEPLOY_TARGET=production ember deploy

Вместо этого предлагается писать

    ember deploy production
    
Зачем же в `ember-cli-deploy` вообще нужна переменная окружения `DEPLOY_TARGET`? Если у вас возникнет необходимость определить **deploy target** в файле `ember-cli-build.js`, то вы можете обратится к ней так: `process.env.DEPLOY_TARGET`.

Беда в том, что файл `config/dotenv.js` отрабатывает раньше, чем команда `ember deploy production` переключает **environment** в `production` и присваивает значение переменной `DEPLOY_TARGET`. 

Выйти из положения можно, указывая `DEPLOY_TARGET` явно, чтобы `config/dotenv.js` использовал именно его.

    DEPLOY_TARGET=production ember deploy production

Но команда получается достаточно громоздкой. Избежать избыточности можно, научив ваш `config/dotenv.js` замечать команду `ember deploy production`:

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

В результате команда `ember deploy production` задействует dotenv-файл `.env-production` и переключит **environment** в `production`.

Если же вам понадобиться залить на production-сервер сборку без минификации, то вы можете воспользоваться командой:

    EMBER_ENV=development ember deploy production



## Ваше мнение?

Обязательно поделитесь своими соображениями в комментариях!
