'use strict';

define('lolma-us/tests/app.lint-test', [], function () {
  'use strict';

  QUnit.module('ESLint | app');

  QUnit.test('adapters/application.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/application.js should pass ESLint\n\n');
  });

  QUnit.test('adapters/cache-buster.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/cache-buster.js should pass ESLint\n\n');
  });

  QUnit.test('adapters/project-info.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/project-info.js should pass ESLint\n\n');
  });

  QUnit.test('adapters/stackoverflow-user.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/stackoverflow-user.js should pass ESLint\n\n');
  });

  QUnit.test('app.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'app.js should pass ESLint\n\n');
  });

  QUnit.test('authenticators/torii.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'authenticators/torii.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/array.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/array.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/is-nully.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/is-nully.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/iso-date.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/iso-date.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/json-stringify.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/json-stringify.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/random-string.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/random-string.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/starts-with.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/starts-with.js should pass ESLint\n\n');
  });

  QUnit.test('initializers/route-head-data.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'initializers/route-head-data.js should pass ESLint\n\n');
  });

  QUnit.test('initializers/showdown.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'initializers/showdown.js should pass ESLint\n\n');
  });

  QUnit.test('initializers/store-push-payload.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'initializers/store-push-payload.js should pass ESLint\n\n');
  });

  QUnit.test('instance-initializers/ember-data-fastboot.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'instance-initializers/ember-data-fastboot.js should pass ESLint\n\n');
  });

  QUnit.test('instance-initializers/rsvp-rollbar.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'instance-initializers/rsvp-rollbar.js should pass ESLint\n\n');
  });

  QUnit.test('instance-initializers/save-html-state.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'instance-initializers/save-html-state.js should pass ESLint\n\n');
  });

  QUnit.test('locales/en/translations.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/en/translations.js should pass ESLint\n\n');
  });

  QUnit.test('locales/ru/translations.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/ru/translations.js should pass ESLint\n\n');
  });

  QUnit.test('macros/t.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'macros/t.js should pass ESLint\n\n');
  });

  QUnit.test('models/cache-buster.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/cache-buster.js should pass ESLint\n\n');
  });

  QUnit.test('models/experience.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/experience.js should pass ESLint\n\n');
  });

  QUnit.test('models/markdown-block.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/markdown-block.js should pass ESLint\n\n');
  });

  QUnit.test('models/post.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/post.js should pass ESLint\n\n');
  });

  QUnit.test('models/project-info.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/project-info.js should pass ESLint\n\n');
  });

  QUnit.test('models/project.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/project.js should pass ESLint\n\n');
  });

  QUnit.test('models/stackoverflow-user.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/stackoverflow-user.js should pass ESLint\n\n');
  });

  QUnit.test('pods/application/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/application/route.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/blog-post/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/blog-post/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/hero-header/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/hero-header/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/horizontal-menu/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/horizontal-menu/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/markdown-block/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/markdown-block/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/online-presence/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/online-presence/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/pro-ject/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/pro-ject/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/pro-jects/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/pro-jects/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/project-group/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/project-group/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/sec-tion/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/sec-tion/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/side-menu/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/side-menu/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/star-button/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/star-button/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/components/time-line/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/components/time-line/component.js should pass ESLint\n\n');
  });

  QUnit.test('pods/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/index/route.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/blog/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/blog/index/route.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/blog/post/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/blog/post/controller.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/blog/post/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/blog/post/route.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/blog/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/blog/route.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/controller.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/index/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/index/controller.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/index/route.js should pass ESLint\n\n');
  });

  QUnit.test('pods/locale/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pods/locale/route.js should pass ESLint\n\n');
  });

  QUnit.test('resolver.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'resolver.js should pass ESLint\n\n');
  });

  QUnit.test('router.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'router.js should pass ESLint\n\n');
  });

  QUnit.test('serializers/_json.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'serializers/_json.js should pass ESLint\n\n');
  });

  QUnit.test('serializers/application.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'serializers/application.js should pass ESLint\n\n');
  });

  QUnit.test('serializers/project-info.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'serializers/project-info.js should pass ESLint\n\n');
  });

  QUnit.test('serializers/stackoverflow-user.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'serializers/stackoverflow-user.js should pass ESLint\n\n');
  });

  QUnit.test('services/config.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'services/config.js should pass ESLint\n\n');
  });

  QUnit.test('services/cookies.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'services/cookies.js should pass ESLint\n\n');
  });

  QUnit.test('services/head-data.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'services/head-data.js should pass ESLint\n\n');
  });

  QUnit.test('services/html-state.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'services/html-state.js should pass ESLint\n\n');
  });

  QUnit.test('services/i18n.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'services/i18n.js should pass ESLint\n\n');
  });

  QUnit.test('session-stores/application.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'session-stores/application.js should pass ESLint\n\n');
  });

  QUnit.test('torii-providers/github-oauth2.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'torii-providers/github-oauth2.js should pass ESLint\n\n');
  });

  QUnit.test('transforms/date.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'transforms/date.js should pass ESLint\n\n');
  });

  QUnit.test('utils/fetch-github.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/fetch-github.js should pass ESLint\n\n');
  });

  QUnit.test('utils/fetch-rsvp.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/fetch-rsvp.js should pass ESLint\n\n');
  });

  QUnit.test('utils/random-string.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/random-string.js should pass ESLint\n\n');
  });

  QUnit.test('utils/wait.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/wait.js should pass ESLint\n\n');
  });
});
define('lolma-us/tests/helpers/destroy-app', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = destroyApp;
  function destroyApp(application) {
    Ember.run(application, 'destroy');
  }
});

define('lolma-us/tests/helpers/ember-i18n/test-helpers', [], function () {
  'use strict';

  // example usage: find(`.header:contains(${t('welcome_message')})`)
  Ember.Test.registerHelper('t', function (app, key, interpolations) {
    var i18n = app.__container__.lookup('service:i18n');
    return i18n.t(key, interpolations);
  });

  // example usage: expectTranslation('.header', 'welcome_message');
  Ember.Test.registerHelper('expectTranslation', function (app, element, key, interpolations) {
    var text = app.testHelpers.t(key, interpolations);

    assertTranslation(element, key, text);
  });

  var assertTranslation = function () {
    if (typeof QUnit !== 'undefined' && typeof QUnit.assert.ok === 'function') {
      return function (element, key, text) {
        QUnit.assert.ok(find(element + ':contains(' + text + ')').length, 'Found translation key ' + key + ' in ' + element);
      };
    } else if (typeof expect === 'function') {
      return function (element, key, text) {
        var found = !!find(element + ':contains(' + text + ')').length;
        expect(found).to.equal(true);
      };
    } else {
      return function () {
        throw new Error("ember-i18n could not find a compatible test framework");
      };
    }
  }();
});

define('lolma-us/tests/helpers/ember-simple-auth', ['exports', 'ember-simple-auth/authenticators/test'], function (exports, _test) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.authenticateSession = authenticateSession;
  exports.currentSession = currentSession;
  exports.invalidateSession = invalidateSession;


  var TEST_CONTAINER_KEY = 'authenticator:test'; /* global wait */

  function ensureAuthenticator(app, container) {
    var authenticator = container.lookup(TEST_CONTAINER_KEY);
    if (!authenticator) {
      app.register(TEST_CONTAINER_KEY, _test.default);
    }
  }

  function authenticateSession(app, sessionData) {
    var container = app.__container__;

    var session = container.lookup('service:session');
    ensureAuthenticator(app, container);
    session.authenticate(TEST_CONTAINER_KEY, sessionData);
    return wait();
  }

  function currentSession(app) {
    return app.__container__.lookup('service:session');
  }

  function invalidateSession(app) {
    var session = app.__container__.lookup('service:session');
    if (session.get('isAuthenticated')) {
      session.invalidate();
    }
    return wait();
  }
});

define('lolma-us/tests/helpers/module-for-acceptance', ['exports', 'qunit', 'lolma-us/tests/helpers/start-app', 'lolma-us/tests/helpers/destroy-app'], function (exports, _qunit, _startApp, _destroyApp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (name) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    (0, _qunit.module)(name, {
      beforeEach: function beforeEach() {
        this.application = (0, _startApp.default)();

        if (options.beforeEach) {
          return options.beforeEach.apply(this, arguments);
        }
      },
      afterEach: function afterEach() {
        var _this = this;

        var afterEach = options.afterEach && options.afterEach.apply(this, arguments);

        return Ember.RSVP.resolve(afterEach).then(function () {
          return (0, _destroyApp.default)(_this.application);
        });
      }
    });
  };
});

define('lolma-us/tests/helpers/resolver', ['exports', 'lolma-us/resolver', 'lolma-us/config/environment'], function (exports, _resolver, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var resolver = _resolver.default.create();

  resolver.namespace = {
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix
  };

  exports.default = resolver;
});

define('lolma-us/tests/helpers/start-app', ['exports', 'lolma-us/app', 'lolma-us/config/environment'], function (exports, _app, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = startApp;

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  function startApp(attrs) {
    var application = void 0;

    var attributes = _extends({}, _environment.default.APP, attrs);

    Ember.run(function () {
      application = _app.default.create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }
});

define('lolma-us/tests/helpers/torii', ['exports', 'lolma-us/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.stubValidSession = stubValidSession;
  var sessionServiceName = _environment.default.torii.sessionServiceName;
  function stubValidSession(application, sessionData) {
    var session = application.__container__.lookup('service:' + sessionServiceName);

    var sm = session.get('stateMachine');
    Ember.run(function () {
      sm.send('startOpen');
      sm.send('finishOpen', sessionData);
    });
  }
});

define('lolma-us/tests/test-helper', ['lolma-us/tests/helpers/resolver', 'ember-qunit'], function (_resolver, _emberQunit) {
  'use strict';

  (0, _emberQunit.setResolver)(_resolver.default);
});

define('lolma-us/tests/tests.lint-test', [], function () {
  'use strict';

  QUnit.module('ESLint | tests');

  QUnit.test('helpers/destroy-app.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/destroy-app.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/module-for-acceptance.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/module-for-acceptance.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/resolver.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/resolver.js should pass ESLint\n\n');
  });

  QUnit.test('helpers/start-app.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/start-app.js should pass ESLint\n\n');
  });

  QUnit.test('test-helper.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'test-helper.js should pass ESLint\n\n');
  });
});
require('lolma-us/tests/test-helper');
EmberENV.TESTS_FILE_LOADED = true;
//# sourceMappingURL=tests.map
