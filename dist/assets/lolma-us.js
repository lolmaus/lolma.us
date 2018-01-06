"use strict";



define('lolma-us/adapters/application', ['exports', 'ember-data/adapters/rest', 'ember-inflector'], function (exports, _rest, _emberInflector) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _rest.default.extend({

    // ----- Services -----
    config: Ember.inject.service(),

    // ----- Overridden properties -----
    host: Ember.computed.reads('config.contentApiHost'),
    namespace: Ember.computed.reads('config.namespace'),

    // ----- Overridden methods -----
    urlForQuery: function urlForQuery(query, modelName) {
      var locale = query.locale;

      if (!locale) throw new Error('locale required for queryRecord');
      delete query.locale;
      return this._buildURL(modelName, null, locale);
    },
    urlForQueryRecord: function urlForQueryRecord(query, modelName) {
      var slug = query.slug,
          locale = query.locale;

      if (!slug) throw new Error('slug required for queryRecord');
      if (!locale) throw new Error('locale required for queryRecord');
      delete query.slug;
      delete query.locale;
      return this._buildURL(modelName, slug, locale);
    },
    _buildURL: function _buildURL(modelName, id, locale) {
      var suffix = locale ? '-' + locale + '.json' : '.json';
      return this._super(modelName, id) + suffix;
    },
    pathForType: function pathForType(modelName) {
      return (0, _emberInflector.pluralize)(modelName);
    }
  });
});

define('lolma-us/adapters/cache-buster', ['exports', 'lolma-us/adapters/application'], function (exports, _application) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _application.default.extend({

    fastboot: Ember.inject.service(),

    urlForFindRecord: function urlForFindRecord(id, modelName, snapshot) {
      var url = this._super(id, modelName, snapshot);
      var rand = Date.now();

      return url + '?bust=' + rand;
    },
    shouldBackgroundReloadAll: function shouldBackgroundReloadAll() {
      return false;
    },
    shouldBackgroundReloadRecord: function shouldBackgroundReloadRecord() {
      return false;
    },
    shouldReloadAll: function shouldReloadAll() {
      return false;
    },
    shouldReloadRecord: function shouldReloadRecord() {
      return false;
    }
  });
});

define('lolma-us/adapters/project-info', ['exports', 'ember-data/adapter', 'lolma-us/utils/fetch-github', 'npm:lodash'], function (exports, _adapter, _fetchGithub, _npmLodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _adapter.default.extend({

    // ----- Services -----
    session: Ember.inject.service(),

    // ----- Overridden methods -----
    findRecord: function findRecord(store, type, id, snapshot) {
      var session = this.get('session');
      var url = 'repos/' + id;

      return (0, _fetchGithub.default)(url, session);
    },
    findAll: function findAll(store, type, sinceToken, snapshotRecordArray) {
      var session = this.get('session');

      // Fetch user info with repo count
      return (0, _fetchGithub.default)('users/lolmaus', session)

      // Fetch repos in batches of 100
      .then(function (_ref) {
        var public_repos = _ref.public_repos;
        return Ember.RSVP.all(_npmLodash.default.times(Math.ceil(public_repos / 100), function (i) {
          return (0, _fetchGithub.default)('users/lolmaus/repos?per_page=100&page=' + (i + 1), session);
        }));
      })

      // Join repo batches into a single array of batches
      .then(function (projectInfoBatches) {
        return projectInfoBatches.reduce(function (a, b) {
          return a.concat(b);
        }, []);
      }); //flatten
    }
  }

  // shouldBackgroundReloadAll    () { return false },
  // shouldBackgroundReloadRecord () { return false },
  // shouldReloadAll              () { return true },
  // shouldReloadRecord           () { return true },
  );
});

define('lolma-us/adapters/stackoverflow-user', ['exports', 'ember-data/adapter', 'lolma-us/utils/fetch-rsvp'], function (exports, _adapter, _fetchRsvp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _adapter.default.extend({

    // ----- Overridden methods -----
    findRecord: function findRecord(store, type, id, snapshot) {
      var url = 'https://api.stackexchange.com/2.2/users/' + id + '?site=stackoverflow';
      return (0, _fetchRsvp.default)(url);
    }
  });
});

define('lolma-us/app', ['exports', 'lolma-us/resolver', 'ember-load-initializers', 'lolma-us/config/environment'], function (exports, _resolver, _emberLoadInitializers, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  exports.default = App;
});

define('lolma-us/authenticators/torii', ['exports', 'ember-simple-auth/authenticators/torii', 'lolma-us/utils/fetch-rsvp', 'lolma-us/utils/fetch-github'], function (exports, _torii, _fetchRsvp, _fetchGithub) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

  exports.default = _torii.default.extend({

    // ----- Services -----
    config: Ember.inject.service(),
    metrics: Ember.inject.service(),
    rollbar: Ember.inject.service(),
    torii: Ember.inject.service(),

    // ----- Overridden methods -----
    authenticate: function authenticate(provider) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._assertToriiIsPresent();

      var gatekeeperUrl = this.get('config.gatekeeperUrl');

      return this.get('torii')

      // Open popup with GitHub Auth
      .open(provider, options)

      // Retrieve GitHub token using authorizationCode
      .then(function (response) {
        var url = gatekeeperUrl + '/authenticate/' + response.authorizationCode;
        return (0, _fetchRsvp.default)(url);
      })

      // Fail if HTTP code is ok but payload contains error
      .then(function (data) {
        if (data.error) {
          if (options.analConsent) {
            _this.get('metrics').trackEvent({
              category: 'Logging in and out',
              action: 'login failure',
              label: 'GitHub: ' + JSON.stringify(data.error)
            });
          }

          return Ember.RSVP.reject(data);
        }

        return _extends({}, data, { analConsent: options.analConsent });
      })

      // Required by ToriiAuthenticator
      .then(function (data) {
        return _this._authenticateWithProvider(provider, data), data;
      })

      // Track and retireve GitHub user info
      .then(function (data) {
        _this.get('metrics').trackEvent({
          category: 'Logging in and out',
          action: 'login',
          label: 'GitHub',
          value: data.analConsent && data.login
        });

        if (!data.analConsent) return data;

        return (0, _fetchGithub.default)('user', data.token).then(function (user) {
          _this.set('rollbar.currentUser', { id: data.login });

          var metrics = _this.get('metrics');

          metrics.set('context.userName', user.login);
          metrics.identify({ distinctId: user.login });

          return _extends({}, data, user);
        });
      });
    },
    restore: function restore(data) {
      var _this2 = this;

      return this._super(data).then(function (data) {
        var metrics = _this2.get('metrics');
        var gitHubLogin = data.analConsent && data.login;

        if (gitHubLogin) {
          _this2.set('rollbar.currentUser', { id: data.login });
          metrics.set('context.userName', gitHubLogin);
          metrics.identify({ distinctId: gitHubLogin });
        }

        metrics.trackEvent({
          category: 'Logging in and out',
          action: 'restore',
          label: 'GitHub',
          value: gitHubLogin
        });

        return data;
      });
    },
    invalidate: function invalidate() {
      var _this3 = this;

      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var gitHubLogin = data.analConsent && data.login;

      return this._super(data).then(function () {
        _this3.set('rollbar.currentUser', null);

        var metrics = _this3.get('metrics');

        if (gitHubLogin) {
          metrics.set('context.userName', null);
          metrics.identify({ distinctId: null });
        }

        metrics.trackEvent({
          category: 'Logging in and out',
          action: 'logout',
          label: 'GitHub',
          value: gitHubLogin
        });
      });
    }
  }

  // ----- Custom methods -----
  );
});

define('lolma-us/components/deferred-content', ['exports', 'ember-deferred-content/components/deferred-content'], function (exports, _deferredContent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _deferredContent.default;
    }
  });
});

define('lolma-us/components/deferred-content/fulfilled-content', ['exports', 'ember-deferred-content/components/deferred-content/fulfilled-content'], function (exports, _fulfilledContent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _fulfilledContent.default;
    }
  });
});

define('lolma-us/components/deferred-content/pending-content', ['exports', 'ember-deferred-content/components/deferred-content/pending-content'], function (exports, _pendingContent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pendingContent.default;
    }
  });
});

define('lolma-us/components/deferred-content/rejected-content', ['exports', 'ember-deferred-content/components/deferred-content/rejected-content'], function (exports, _rejectedContent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rejectedContent.default;
    }
  });
});

define('lolma-us/components/deferred-content/settled-content', ['exports', 'ember-deferred-content/components/deferred-content/settled-content'], function (exports, _settledContent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _settledContent.default;
    }
  });
});

define('lolma-us/components/disqus-comment-count', ['exports', 'ember-disqus/components/disqus-comment-count'], function (exports, _disqusCommentCount) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _disqusCommentCount.default;
    }
  });
});

define('lolma-us/components/disqus-comments', ['exports', 'ember-disqus/components/disqus-comments'], function (exports, _disqusComments) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _disqusComments.default;
    }
  });
});

define('lolma-us/components/head-content', ['exports', 'lolma-us/templates/head'], function (exports, _head) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    tagName: '',
    model: Ember.inject.service('head-data'),
    layout: _head.default
  });
});

define('lolma-us/components/head-layout', ['exports', 'ember-cli-head/templates/components/head-layout'], function (exports, _headLayout) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    tagName: '',
    headElement: Ember.computed(function () {
      var documentService = Ember.getOwner(this).lookup('service:-document');
      return documentService.head;
    }),
    layout: _headLayout.default
  });
});

define('lolma-us/components/markdown-to-html', ['exports', 'ember-cli-showdown/components/markdown-to-html'], function (exports, _markdownToHtml) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _markdownToHtml.default;
    }
  });
});

define('lolma-us/components/scroll-to', ['exports', 'ember-scroll-to-mk2/components/scroll-to'], function (exports, _scrollTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _scrollTo.default;
    }
  });
});

define('lolma-us/components/torii-iframe-placeholder', ['exports', 'torii/components/torii-iframe-placeholder'], function (exports, _toriiIframePlaceholder) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _toriiIframePlaceholder.default;
});

define('lolma-us/helpers/and', ['exports', 'ember-truth-helpers/helpers/and'], function (exports, _and) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _and.default;
    }
  });
  Object.defineProperty(exports, 'and', {
    enumerable: true,
    get: function () {
      return _and.and;
    }
  });
});

define('lolma-us/helpers/app-version', ['exports', 'lolma-us/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;
  var version = _environment.default.APP.version;
  function appVersion(_) {
    var hash = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (hash.hideSha) {
      return version.match(_regexp.versionRegExp)[0];
    }

    if (hash.hideVersion) {
      return version.match(_regexp.shaRegExp)[0];
    }

    return version;
  }

  exports.default = Ember.Helper.helper(appVersion);
});

define('lolma-us/helpers/append', ['exports', 'ember-composable-helpers/helpers/append'], function (exports, _append) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _append.default;
    }
  });
  Object.defineProperty(exports, 'append', {
    enumerable: true,
    get: function () {
      return _append.append;
    }
  });
});

define('lolma-us/helpers/array', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.array = array;
  function array(params /*, hash*/) {
    return params;
  }

  exports.default = Ember.Helper.helper(array);
});

define('lolma-us/helpers/chunk', ['exports', 'ember-composable-helpers/helpers/chunk'], function (exports, _chunk) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _chunk.default;
    }
  });
  Object.defineProperty(exports, 'chunk', {
    enumerable: true,
    get: function () {
      return _chunk.chunk;
    }
  });
});

define('lolma-us/helpers/compact', ['exports', 'ember-composable-helpers/helpers/compact'], function (exports, _compact) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _compact.default;
    }
  });
  Object.defineProperty(exports, 'compact', {
    enumerable: true,
    get: function () {
      return _compact.compact;
    }
  });
});

define('lolma-us/helpers/compute', ['exports', 'ember-composable-helpers/helpers/compute'], function (exports, _compute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _compute.default;
    }
  });
  Object.defineProperty(exports, 'compute', {
    enumerable: true,
    get: function () {
      return _compute.compute;
    }
  });
});

define('lolma-us/helpers/contains', ['exports', 'ember-composable-helpers/helpers/contains'], function (exports, _contains) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _contains.default;
    }
  });
  Object.defineProperty(exports, 'contains', {
    enumerable: true,
    get: function () {
      return _contains.contains;
    }
  });
});

define('lolma-us/helpers/dec', ['exports', 'ember-composable-helpers/helpers/dec'], function (exports, _dec) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dec.default;
    }
  });
  Object.defineProperty(exports, 'dec', {
    enumerable: true,
    get: function () {
      return _dec.dec;
    }
  });
});

define('lolma-us/helpers/drop', ['exports', 'ember-composable-helpers/helpers/drop'], function (exports, _drop) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _drop.default;
    }
  });
  Object.defineProperty(exports, 'drop', {
    enumerable: true,
    get: function () {
      return _drop.drop;
    }
  });
});

define('lolma-us/helpers/eq', ['exports', 'ember-truth-helpers/helpers/equal'], function (exports, _equal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _equal.default;
    }
  });
  Object.defineProperty(exports, 'equal', {
    enumerable: true,
    get: function () {
      return _equal.equal;
    }
  });
});

define('lolma-us/helpers/filter-by', ['exports', 'ember-composable-helpers/helpers/filter-by'], function (exports, _filterBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filterBy.default;
    }
  });
  Object.defineProperty(exports, 'filterBy', {
    enumerable: true,
    get: function () {
      return _filterBy.filterBy;
    }
  });
});

define('lolma-us/helpers/filter', ['exports', 'ember-composable-helpers/helpers/filter'], function (exports, _filter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filter.default;
    }
  });
  Object.defineProperty(exports, 'filter', {
    enumerable: true,
    get: function () {
      return _filter.filter;
    }
  });
});

define('lolma-us/helpers/find-by', ['exports', 'ember-composable-helpers/helpers/find-by'], function (exports, _findBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _findBy.default;
    }
  });
  Object.defineProperty(exports, 'findBy', {
    enumerable: true,
    get: function () {
      return _findBy.findBy;
    }
  });
});

define('lolma-us/helpers/flatten', ['exports', 'ember-composable-helpers/helpers/flatten'], function (exports, _flatten) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _flatten.default;
    }
  });
  Object.defineProperty(exports, 'flatten', {
    enumerable: true,
    get: function () {
      return _flatten.flatten;
    }
  });
});

define('lolma-us/helpers/group-by', ['exports', 'ember-composable-helpers/helpers/group-by'], function (exports, _groupBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _groupBy.default;
    }
  });
  Object.defineProperty(exports, 'groupBy', {
    enumerable: true,
    get: function () {
      return _groupBy.groupBy;
    }
  });
});

define('lolma-us/helpers/gt', ['exports', 'ember-truth-helpers/helpers/gt'], function (exports, _gt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _gt.default;
    }
  });
  Object.defineProperty(exports, 'gt', {
    enumerable: true,
    get: function () {
      return _gt.gt;
    }
  });
});

define('lolma-us/helpers/gte', ['exports', 'ember-truth-helpers/helpers/gte'], function (exports, _gte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _gte.default;
    }
  });
  Object.defineProperty(exports, 'gte', {
    enumerable: true,
    get: function () {
      return _gte.gte;
    }
  });
});

define('lolma-us/helpers/has-next', ['exports', 'ember-composable-helpers/helpers/has-next'], function (exports, _hasNext) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hasNext.default;
    }
  });
  Object.defineProperty(exports, 'hasNext', {
    enumerable: true,
    get: function () {
      return _hasNext.hasNext;
    }
  });
});

define('lolma-us/helpers/has-previous', ['exports', 'ember-composable-helpers/helpers/has-previous'], function (exports, _hasPrevious) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hasPrevious.default;
    }
  });
  Object.defineProperty(exports, 'hasPrevious', {
    enumerable: true,
    get: function () {
      return _hasPrevious.hasPrevious;
    }
  });
});

define('lolma-us/helpers/inc', ['exports', 'ember-composable-helpers/helpers/inc'], function (exports, _inc) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _inc.default;
    }
  });
  Object.defineProperty(exports, 'inc', {
    enumerable: true,
    get: function () {
      return _inc.inc;
    }
  });
});

define('lolma-us/helpers/intersect', ['exports', 'ember-composable-helpers/helpers/intersect'], function (exports, _intersect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _intersect.default;
    }
  });
  Object.defineProperty(exports, 'intersect', {
    enumerable: true,
    get: function () {
      return _intersect.intersect;
    }
  });
});

define('lolma-us/helpers/invoke', ['exports', 'ember-composable-helpers/helpers/invoke'], function (exports, _invoke) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _invoke.default;
    }
  });
  Object.defineProperty(exports, 'invoke', {
    enumerable: true,
    get: function () {
      return _invoke.invoke;
    }
  });
});

define('lolma-us/helpers/is-after', ['exports', 'ember-moment/helpers/is-after'], function (exports, _isAfter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isAfter.default;
    }
  });
});

define('lolma-us/helpers/is-array', ['exports', 'ember-truth-helpers/helpers/is-array'], function (exports, _isArray) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isArray.default;
    }
  });
  Object.defineProperty(exports, 'isArray', {
    enumerable: true,
    get: function () {
      return _isArray.isArray;
    }
  });
});

define('lolma-us/helpers/is-before', ['exports', 'ember-moment/helpers/is-before'], function (exports, _isBefore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isBefore.default;
    }
  });
});

define('lolma-us/helpers/is-between', ['exports', 'ember-moment/helpers/is-between'], function (exports, _isBetween) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isBetween.default;
    }
  });
});

define('lolma-us/helpers/is-equal', ['exports', 'ember-truth-helpers/helpers/is-equal'], function (exports, _isEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isEqual.default;
    }
  });
  Object.defineProperty(exports, 'isEqual', {
    enumerable: true,
    get: function () {
      return _isEqual.isEqual;
    }
  });
});

define('lolma-us/helpers/is-nully', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.isNully = isNully;

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function isNully(_ref) /*, hash*/{
    var _ref2 = _slicedToArray(_ref, 1),
        value = _ref2[0];

    return value == null;
  }

  exports.default = Ember.Helper.helper(isNully);
});

define('lolma-us/helpers/is-same-or-after', ['exports', 'ember-moment/helpers/is-same-or-after'], function (exports, _isSameOrAfter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSameOrAfter.default;
    }
  });
});

define('lolma-us/helpers/is-same-or-before', ['exports', 'ember-moment/helpers/is-same-or-before'], function (exports, _isSameOrBefore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSameOrBefore.default;
    }
  });
});

define('lolma-us/helpers/is-same', ['exports', 'ember-moment/helpers/is-same'], function (exports, _isSame) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSame.default;
    }
  });
});

define('lolma-us/helpers/iso-date', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.isoDate = isoDate;

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function isoDate(_ref) /*, hash*/{
    var _ref2 = _slicedToArray(_ref, 1),
        date = _ref2[0];

    return date && date.toISOString();
  }

  exports.default = Ember.Helper.helper(isoDate);
});

define('lolma-us/helpers/join', ['exports', 'ember-composable-helpers/helpers/join'], function (exports, _join) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _join.default;
    }
  });
  Object.defineProperty(exports, 'join', {
    enumerable: true,
    get: function () {
      return _join.join;
    }
  });
});

define('lolma-us/helpers/json-stringify', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  exports.default = Ember.Helper.extend({
    config: Ember.inject.service(),

    compute: function compute(_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          obj = _ref2[0];

      return this.get('config.isProd') ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
    }
  });
});

define('lolma-us/helpers/lt', ['exports', 'ember-truth-helpers/helpers/lt'], function (exports, _lt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lt.default;
    }
  });
  Object.defineProperty(exports, 'lt', {
    enumerable: true,
    get: function () {
      return _lt.lt;
    }
  });
});

define('lolma-us/helpers/lte', ['exports', 'ember-truth-helpers/helpers/lte'], function (exports, _lte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lte.default;
    }
  });
  Object.defineProperty(exports, 'lte', {
    enumerable: true,
    get: function () {
      return _lte.lte;
    }
  });
});

define('lolma-us/helpers/map-by', ['exports', 'ember-composable-helpers/helpers/map-by'], function (exports, _mapBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mapBy.default;
    }
  });
  Object.defineProperty(exports, 'mapBy', {
    enumerable: true,
    get: function () {
      return _mapBy.mapBy;
    }
  });
});

define('lolma-us/helpers/map', ['exports', 'ember-composable-helpers/helpers/map'], function (exports, _map) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _map.default;
    }
  });
  Object.defineProperty(exports, 'map', {
    enumerable: true,
    get: function () {
      return _map.map;
    }
  });
});

define('lolma-us/helpers/moment-add', ['exports', 'ember-moment/helpers/moment-add'], function (exports, _momentAdd) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentAdd.default;
    }
  });
});

define('lolma-us/helpers/moment-calendar', ['exports', 'ember-moment/helpers/moment-calendar'], function (exports, _momentCalendar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentCalendar.default;
    }
  });
});

define('lolma-us/helpers/moment-diff', ['exports', 'ember-moment/helpers/moment-diff'], function (exports, _momentDiff) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentDiff.default;
    }
  });
});

define('lolma-us/helpers/moment-duration', ['exports', 'ember-moment/helpers/moment-duration'], function (exports, _momentDuration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentDuration.default;
    }
  });
});

define('lolma-us/helpers/moment-format', ['exports', 'ember-moment/helpers/moment-format'], function (exports, _momentFormat) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFormat.default;
    }
  });
});

define('lolma-us/helpers/moment-from-now', ['exports', 'ember-moment/helpers/moment-from-now'], function (exports, _momentFromNow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFromNow.default;
    }
  });
});

define('lolma-us/helpers/moment-from', ['exports', 'ember-moment/helpers/moment-from'], function (exports, _momentFrom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFrom.default;
    }
  });
});

define('lolma-us/helpers/moment-subtract', ['exports', 'ember-moment/helpers/moment-subtract'], function (exports, _momentSubtract) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentSubtract.default;
    }
  });
});

define('lolma-us/helpers/moment-to-date', ['exports', 'ember-moment/helpers/moment-to-date'], function (exports, _momentToDate) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentToDate.default;
    }
  });
});

define('lolma-us/helpers/moment-to-now', ['exports', 'ember-moment/helpers/moment-to-now'], function (exports, _momentToNow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentToNow.default;
    }
  });
});

define('lolma-us/helpers/moment-to', ['exports', 'ember-moment/helpers/moment-to'], function (exports, _momentTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentTo.default;
    }
  });
});

define('lolma-us/helpers/moment-unix', ['exports', 'ember-moment/helpers/unix'], function (exports, _unix) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
  Object.defineProperty(exports, 'unix', {
    enumerable: true,
    get: function () {
      return _unix.unix;
    }
  });
});

define('lolma-us/helpers/moment', ['exports', 'ember-moment/helpers/moment'], function (exports, _moment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _moment.default;
    }
  });
});

define('lolma-us/helpers/next', ['exports', 'ember-composable-helpers/helpers/next'], function (exports, _next) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _next.default;
    }
  });
  Object.defineProperty(exports, 'next', {
    enumerable: true,
    get: function () {
      return _next.next;
    }
  });
});

define('lolma-us/helpers/not-eq', ['exports', 'ember-truth-helpers/helpers/not-equal'], function (exports, _notEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _notEqual.default;
    }
  });
  Object.defineProperty(exports, 'notEq', {
    enumerable: true,
    get: function () {
      return _notEqual.notEq;
    }
  });
});

define('lolma-us/helpers/not', ['exports', 'ember-truth-helpers/helpers/not'], function (exports, _not) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _not.default;
    }
  });
  Object.defineProperty(exports, 'not', {
    enumerable: true,
    get: function () {
      return _not.not;
    }
  });
});

define('lolma-us/helpers/now', ['exports', 'ember-moment/helpers/now'], function (exports, _now) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _now.default;
    }
  });
});

define('lolma-us/helpers/object-at', ['exports', 'ember-composable-helpers/helpers/object-at'], function (exports, _objectAt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _objectAt.default;
    }
  });
  Object.defineProperty(exports, 'objectAt', {
    enumerable: true,
    get: function () {
      return _objectAt.objectAt;
    }
  });
});

define('lolma-us/helpers/optional', ['exports', 'ember-composable-helpers/helpers/optional'], function (exports, _optional) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _optional.default;
    }
  });
  Object.defineProperty(exports, 'optional', {
    enumerable: true,
    get: function () {
      return _optional.optional;
    }
  });
});

define('lolma-us/helpers/or', ['exports', 'ember-truth-helpers/helpers/or'], function (exports, _or) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _or.default;
    }
  });
  Object.defineProperty(exports, 'or', {
    enumerable: true,
    get: function () {
      return _or.or;
    }
  });
});

define('lolma-us/helpers/pipe-action', ['exports', 'ember-composable-helpers/helpers/pipe-action'], function (exports, _pipeAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pipeAction.default;
    }
  });
});

define('lolma-us/helpers/pipe', ['exports', 'ember-composable-helpers/helpers/pipe'], function (exports, _pipe) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pipe.default;
    }
  });
  Object.defineProperty(exports, 'pipe', {
    enumerable: true,
    get: function () {
      return _pipe.pipe;
    }
  });
});

define('lolma-us/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _pluralize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _pluralize.default;
});

define('lolma-us/helpers/previous', ['exports', 'ember-composable-helpers/helpers/previous'], function (exports, _previous) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _previous.default;
    }
  });
  Object.defineProperty(exports, 'previous', {
    enumerable: true,
    get: function () {
      return _previous.previous;
    }
  });
});

define('lolma-us/helpers/queue', ['exports', 'ember-composable-helpers/helpers/queue'], function (exports, _queue) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _queue.default;
    }
  });
  Object.defineProperty(exports, 'queue', {
    enumerable: true,
    get: function () {
      return _queue.queue;
    }
  });
});

define('lolma-us/helpers/random-string', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.randomString = randomString;
  function randomString() /*values, hash*/{
    return Math.random().toString(36).substr(2, 5);
  }

  exports.default = Ember.Helper.helper(randomString);
});

define('lolma-us/helpers/range', ['exports', 'ember-composable-helpers/helpers/range'], function (exports, _range) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _range.default;
    }
  });
  Object.defineProperty(exports, 'range', {
    enumerable: true,
    get: function () {
      return _range.range;
    }
  });
});

define('lolma-us/helpers/reduce', ['exports', 'ember-composable-helpers/helpers/reduce'], function (exports, _reduce) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _reduce.default;
    }
  });
  Object.defineProperty(exports, 'reduce', {
    enumerable: true,
    get: function () {
      return _reduce.reduce;
    }
  });
});

define('lolma-us/helpers/reject-by', ['exports', 'ember-composable-helpers/helpers/reject-by'], function (exports, _rejectBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rejectBy.default;
    }
  });
  Object.defineProperty(exports, 'rejectBy', {
    enumerable: true,
    get: function () {
      return _rejectBy.rejectBy;
    }
  });
});

define('lolma-us/helpers/repeat', ['exports', 'ember-composable-helpers/helpers/repeat'], function (exports, _repeat) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _repeat.default;
    }
  });
  Object.defineProperty(exports, 'repeat', {
    enumerable: true,
    get: function () {
      return _repeat.repeat;
    }
  });
});

define('lolma-us/helpers/reverse', ['exports', 'ember-composable-helpers/helpers/reverse'], function (exports, _reverse) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _reverse.default;
    }
  });
  Object.defineProperty(exports, 'reverse', {
    enumerable: true,
    get: function () {
      return _reverse.reverse;
    }
  });
});

define('lolma-us/helpers/route-action', ['exports', 'ember-route-action-helper/helpers/route-action'], function (exports, _routeAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _routeAction.default;
    }
  });
});

define('lolma-us/helpers/shuffle', ['exports', 'ember-composable-helpers/helpers/shuffle'], function (exports, _shuffle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _shuffle.default;
    }
  });
  Object.defineProperty(exports, 'shuffle', {
    enumerable: true,
    get: function () {
      return _shuffle.shuffle;
    }
  });
});

define('lolma-us/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _singularize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _singularize.default;
});

define('lolma-us/helpers/slice', ['exports', 'ember-composable-helpers/helpers/slice'], function (exports, _slice) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _slice.default;
    }
  });
  Object.defineProperty(exports, 'slice', {
    enumerable: true,
    get: function () {
      return _slice.slice;
    }
  });
});

define('lolma-us/helpers/sort-by', ['exports', 'ember-composable-helpers/helpers/sort-by'], function (exports, _sortBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sortBy.default;
    }
  });
  Object.defineProperty(exports, 'sortBy', {
    enumerable: true,
    get: function () {
      return _sortBy.sortBy;
    }
  });
});

define('lolma-us/helpers/starts-with', ['exports', 'npm:lodash'], function (exports, _npmLodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.startsWith = startsWith;

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function startsWith(_ref) /*, hash*/{
    var _ref2 = _slicedToArray(_ref, 2),
        str = _ref2[0],
        substr = _ref2[1];

    return _npmLodash.default.startsWith(str, substr);
  }

  exports.default = Ember.Helper.helper(startsWith);
});

define('lolma-us/helpers/svg-jar', ['exports', 'ember-svg-jar/utils/make-helper', 'ember-svg-jar/utils/make-svg', 'lolma-us/inline-assets'], function (exports, _makeHelper, _makeSvg, _inlineAssets) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.svgJar = svgJar;
  function svgJar(assetId, svgAttrs) {
    return Ember.String.htmlSafe((0, _makeSvg.default)(assetId, svgAttrs, _inlineAssets.default));
  }

  exports.default = (0, _makeHelper.default)(svgJar);
});

define('lolma-us/helpers/t', ['exports', 'ember-i18n/helper'], function (exports, _helper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _helper.default;
    }
  });
});

define('lolma-us/helpers/take', ['exports', 'ember-composable-helpers/helpers/take'], function (exports, _take) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _take.default;
    }
  });
  Object.defineProperty(exports, 'take', {
    enumerable: true,
    get: function () {
      return _take.take;
    }
  });
});

define('lolma-us/helpers/toggle-action', ['exports', 'ember-composable-helpers/helpers/toggle-action'], function (exports, _toggleAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggleAction.default;
    }
  });
});

define('lolma-us/helpers/toggle', ['exports', 'ember-composable-helpers/helpers/toggle'], function (exports, _toggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
  Object.defineProperty(exports, 'toggle', {
    enumerable: true,
    get: function () {
      return _toggle.toggle;
    }
  });
});

define('lolma-us/helpers/union', ['exports', 'ember-composable-helpers/helpers/union'], function (exports, _union) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _union.default;
    }
  });
  Object.defineProperty(exports, 'union', {
    enumerable: true,
    get: function () {
      return _union.union;
    }
  });
});

define('lolma-us/helpers/unix', ['exports', 'ember-moment/helpers/unix'], function (exports, _unix) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
  Object.defineProperty(exports, 'unix', {
    enumerable: true,
    get: function () {
      return _unix.unix;
    }
  });
});

define('lolma-us/helpers/without', ['exports', 'ember-composable-helpers/helpers/without'], function (exports, _without) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _without.default;
    }
  });
  Object.defineProperty(exports, 'without', {
    enumerable: true,
    get: function () {
      return _without.without;
    }
  });
});

define('lolma-us/helpers/xor', ['exports', 'ember-truth-helpers/helpers/xor'], function (exports, _xor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _xor.default;
    }
  });
  Object.defineProperty(exports, 'xor', {
    enumerable: true,
    get: function () {
      return _xor.xor;
    }
  });
});

define('lolma-us/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'lolma-us/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var name = void 0,
      version = void 0;
  if (_environment.default.APP) {
    name = _environment.default.APP.name;
    version = _environment.default.APP.version;
  }

  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});

define('lolma-us/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize: function initialize() {
      var app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});

define('lolma-us/initializers/data-adapter', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'data-adapter',
    before: 'store',
    initialize: function initialize() {}
  };
});

define('lolma-us/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data'], function (exports, _setupContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-data',
    initialize: _setupContainer.default
  };
});

define('lolma-us/initializers/ember-i18n', ['exports', 'ember-i18n/initializers/ember-i18n'], function (exports, _emberI18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberI18n.default;
});

define('lolma-us/initializers/ember-simple-auth', ['exports', 'lolma-us/config/environment', 'ember-simple-auth/configuration', 'ember-simple-auth/initializers/setup-session', 'ember-simple-auth/initializers/setup-session-service'], function (exports, _environment, _configuration, _setupSession, _setupSessionService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize: function initialize(registry) {
      var config = _environment.default['ember-simple-auth'] || {};
      config.baseURL = _environment.default.rootURL || _environment.default.baseURL;
      _configuration.default.load(config);

      (0, _setupSession.default)(registry);
      (0, _setupSessionService.default)(registry);
    }
  };
});

define('lolma-us/initializers/export-application-global', ['exports', 'lolma-us/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});

define('lolma-us/initializers/initialize-torii-callback', ['exports', 'lolma-us/config/environment', 'torii/redirect-handler'], function (exports, _environment, _redirectHandler) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'torii-callback',
    before: 'torii',
    initialize: function initialize(application) {
      if (arguments[1]) {
        // Ember < 2.1
        application = arguments[1];
      }
      if (_environment.default.torii && _environment.default.torii.disableRedirectInitializer) {
        return;
      }
      application.deferReadiness();
      _redirectHandler.default.handle(window).catch(function () {
        application.advanceReadiness();
      });
    }
  };
});

define('lolma-us/initializers/initialize-torii-session', ['exports', 'torii/bootstrap/session', 'torii/configuration'], function (exports, _session, _configuration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'torii-session',
    after: 'torii',

    initialize: function initialize(application) {
      if (arguments[1]) {
        // Ember < 2.1
        application = arguments[1];
      }
      var configuration = (0, _configuration.getConfiguration)();
      if (!configuration.sessionServiceName) {
        return;
      }

      (0, _session.default)(application, configuration.sessionServiceName);

      var sessionFactoryName = 'service:' + configuration.sessionServiceName;
      application.inject('adapter', configuration.sessionServiceName, sessionFactoryName);
    }
  };
});

define('lolma-us/initializers/initialize-torii', ['exports', 'torii/bootstrap/torii', 'torii/configuration', 'lolma-us/config/environment'], function (exports, _torii, _configuration, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var initializer = {
    name: 'torii',
    initialize: function initialize(application) {
      if (arguments[1]) {
        // Ember < 2.1
        application = arguments[1];
      }
      (0, _configuration.configure)(_environment.default.torii || {});
      (0, _torii.default)(application);
      application.inject('route', 'torii', 'service:torii');
    }
  };

  exports.default = initializer;
});

define('lolma-us/initializers/injectStore', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'injectStore',
    before: 'store',
    initialize: function initialize() {}
  };
});

define('lolma-us/initializers/metrics', ['exports', 'lolma-us/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    var _config$metricsAdapte = _environment.default.metricsAdapters,
        metricsAdapters = _config$metricsAdapte === undefined ? [] : _config$metricsAdapte;
    var _config$environment = _environment.default.environment,
        environment = _config$environment === undefined ? 'development' : _config$environment;

    var options = { metricsAdapters: metricsAdapters, environment: environment };

    application.register('config:metrics', options, { instantiate: false });
    application.inject('service:metrics', 'options', 'config:metrics');
  }

  exports.default = {
    name: 'metrics',
    initialize: initialize
  };
});

define('lolma-us/initializers/nprogress', ['exports', 'ember-cli-nprogress/initializers/nprogress'], function (exports, _nprogress) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _nprogress.default;
    }
  });
  Object.defineProperty(exports, 'initialize', {
    enumerable: true,
    get: function () {
      return _nprogress.initialize;
    }
  });
});

define('lolma-us/initializers/route-head-data', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {

    Ember.Route.reopen({
      headData: Ember.inject.service(),

      afterModel: function afterModel(model, transition) {
        this.get('headData').setProperties({ model: model });
      }
    });
  }

  exports.default = {
    name: 'route-head-data',
    initialize: initialize
  };
});

define('lolma-us/initializers/showdown', ['exports', 'showdown', 'npm:highlight.js'], function (exports, _showdown, _npmHighlight) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;


  function htmlunencode(text) {
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  function initialize() {
    _showdown.default.setFlavor('github');

    _showdown.default.extension('codehighlight', function () {
      function replacement(wholeMatch, match, left, right) {
        var classesRegex = /class="(.+?)"/;
        var hasClasses = classesRegex.test(left);

        // unescape match to prevent double escaping
        match = htmlunencode(match);

        var newLeft = hasClasses ? left.replace(classesRegex, 'class="$1 hljs"') : left.replace(/>$/, ' class="hljs">');

        var lang = hasClasses && left.match(classesRegex)[1].split(' ')[0];
        var code = lang ? _npmHighlight.default.highlight(lang, match).value : match;

        return '<div class="code-block">' + newLeft + code + right + '</div>';
      }

      return {
        type: 'output',
        filter: function filter(text, converter, options) {
          // use new showdown's regexp engine to conditionally parse code blocks
          var left = '<pre.*?><code.*?>';
          var right = '</code></pre>';
          var flags = 'g';
          return _showdown.default.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
        }
      };
    });

    _showdown.default.extension('linkable-headers', function () {
      return {
        type: 'output',
        regex: /<h(\d?) id="(.+?)">(.+?)<\/h\d?>/g,
        replace: '<h$1 id="$2" class="headingWithLink"><a href="#$2" class="headingWithLink-link">#</a>$3</h$1>'
      };
    });
  }

  exports.default = {
    name: 'showdown',
    initialize: initialize
  };
});

define('lolma-us/initializers/store-push-payload', ['exports', 'ember-data/store'], function (exports, _store) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() /* application */{
    _store.default.reopen({
      pushPayload: function pushPayload(modelName, inputPayload) {
        var serializer = void 0;
        var payload = void 0;

        if (!inputPayload) {
          payload = modelName;
          serializer = this.serializerFor('application');
          (true && !(typeof serializer.pushPayload === 'function') && Ember.assert('You cannot use `store#pushPayload` without a modelName unless your default serializer defines `pushPayload`', typeof serializer.pushPayload === 'function'));
        } else {
          payload = inputPayload;
          (true && !(typeof modelName === 'string') && Ember.assert('Passing classes to store methods has been removed. Please pass a dasherized string instead of ' + Ember.inspect(modelName), typeof modelName === 'string'));

          serializer = this.serializerFor(modelName);
        }

        return serializer.pushPayload(this, payload);
      }
    });
  }

  exports.default = {
    name: 'store-push-payload',
    initialize: initialize
  };
});

define('lolma-us/initializers/store', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'store',
    after: 'ember-data',
    initialize: function initialize() {}
  };
});

define('lolma-us/initializers/transforms', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'transforms',
    before: 'store',
    initialize: function initialize() {}
  };
});

define("lolma-us/inline-assets", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = { "cc-by": { "content": "<circle fill=\"#FFF\" cx=\"37.637\" cy=\"28.806\" r=\"28.276\"/><path d=\"M37.443-3.5c8.988 0 16.57 3.085 22.742 9.257C66.393 11.967 69.5 19.548 69.5 28.5c0 8.991-3.049 16.476-9.145 22.456-6.476 6.363-14.113 9.544-22.912 9.544-8.649 0-16.153-3.144-22.514-9.43C8.644 44.784 5.5 37.262 5.5 28.5c0-8.761 3.144-16.342 9.429-22.742C21.101-.415 28.604-3.5 37.443-3.5zm.114 5.772c-7.276 0-13.428 2.553-18.457 7.657-5.22 5.334-7.829 11.525-7.829 18.572 0 7.086 2.59 13.22 7.77 18.398 5.181 5.182 11.352 7.771 18.514 7.771 7.123 0 13.334-2.607 18.629-7.828 5.029-4.838 7.543-10.952 7.543-18.343 0-7.276-2.553-13.465-7.656-18.571-5.104-5.104-11.276-7.656-18.514-7.656zm8.572 18.285v13.085h-3.656v15.542h-9.944V33.643h-3.656V20.557c0-.572.2-1.057.599-1.457.401-.399.887-.6 1.457-.6h13.144c.533 0 1.01.2 1.428.6.417.4.628.886.628 1.457zm-13.087-8.228c0-3.008 1.485-4.514 4.458-4.514s4.457 1.504 4.457 4.514c0 2.971-1.486 4.457-4.457 4.457s-4.458-1.486-4.458-4.457z\"/>", "attrs": { "version": "1", "xmlns": "http://www.w3.org/2000/svg", "width": "64", "height": "64", "viewBox": "5.5 -3.5 64 64" } }, "delorean": { "content": "<path d=\"M289.495 28.216l3.185-2.553c-3.125-3.899-7.159-10.659-6.337-13.477.116-.371.334-.798 1.184-1.091 5.144-1.764 23.39 5.589 33.672 10.645l1.802-3.672c-2.883-1.407-28.37-13.742-36.802-10.831-1.94.668-3.249 1.987-3.783 3.812-1.686 5.849 5.598 15.329 7.08 17.167z\" fill=\"#231f20\"/><path d=\"M253.627 30.347C252.197 30.338 194.472 0 194.472 0s-4.555 12.075-5.553 22.975c-.984 10.905.6 28.695.6 28.695l64.108-21.323z\"/><path d=\"M642.378 81.794l-10.209-17.84-139.647-17-77.953-31.815-92.465 1.003s-55.808 8.83-79.526 13.872c-23.723 5.051-54.14 15.046-54.14 15.046l-9.003 23.932-3.43.673-.057 14.382 24.577 20.645 34.894 7.67 82.851 7.869 197.933.788 72.604-3.139 39.735-1.207 8.965-17.775 4.871-17.104z\" fill=\"#d1d1d1\"/><path fill=\"#b6b8b7\" d=\"M175.948 84.046l.046-11.615 462.09 1.843 4.294 7.52-4.87 17.104-8.965 17.775-39.735 1.207-72.605 3.139-197.933-.789-82.85-7.869-34.894-7.67z\"/><path d=\"M642.378 81.794l-10.209-17.84-139.647-17-77.953-31.815-92.465 1.003s-55.808 8.83-79.526 13.872c-23.723 5.051-54.14 15.046-54.14 15.046l-9.003 23.932-3.43.673-.057 14.382 24.577 20.645 34.894 7.67 82.851 7.869 197.933.788 72.604-3.139 39.735-1.207 8.965-17.775 4.871-17.104z\" fill=\"#d1d1d1\"/><path fill=\"#b6b8b7\" d=\"M175.948 84.046l.046-11.615 462.09 1.843 4.294 7.52-4.87 17.104-8.965 17.775-39.735 1.207-72.605 3.139-197.933-.789-82.85-7.869-34.894-7.67z\"/><path fill=\"#251f1f\" d=\"M318.27 120.23l-82.85-7.869-25.21-5.543 390.984 1.559 36.898-9.907-9.549 18.203-39.735 1.207-72.605 3.139z\"/><path fill=\"#676767\" d=\"M599.871 100.286l48.5-2.396 1.175-16.281-49.615 2.762z\"/><path d=\"M521.245 108.178c-.069 18.291 14.694 33.188 32.995 33.263 18.301.075 33.185-14.707 33.26-32.998.073-18.296-14.699-33.185-33-33.259-18.292-.074-33.18 14.698-33.255 32.994z\" fill=\"#251f1f\"/><path d=\"M530.126 108.215c-.056 13.389 10.761 24.284 24.146 24.34 13.39.051 24.294-10.757 24.346-24.146.051-13.389-10.762-24.289-24.15-24.34-13.386-.055-24.286 10.758-24.342 24.146z\" fill=\"#c2c2c2\"/><path d=\"M537.907 108.247c-.037 9.095 7.307 16.499 16.402 16.536 9.095.037 16.5-7.312 16.537-16.406.037-9.1-7.312-16.499-16.407-16.536-9.095-.037-16.495 7.307-16.532 16.406z\" fill=\"#efefef\"/><path d=\"M473.682 48.43c-3.324-1.119-57.26-27.251-57.26-27.251l-71.45.088-.11 27.762 127.701 1.987 1.12-2.586z\" fill=\"#251f1f\"/><path d=\"M501.5 107.44c1.04-1.389 2.47-4.229 4.132-7.53 7.052-14.029 18.867-37.511 43.26-38.397 21.991-.794 30.64 5.933 35.264 9.554.51.413 1.151.896 1.513 1.142.915-.01 2.224-.037 3.747-.07 8.333-.171 14.935-.246 17.725.433 5.111 1.248 7.48 8.23 8.245 11.174l-7.888 2.089c-.585-2.187-1.773-4.702-2.52-5.371-2.382-.432-11.454-.241-15.39-.158-1.89.037-3.469.075-4.42.07-2.397-.01-4.165-1.402-6.045-2.879-3.802-2.976-10.89-8.537-29.935-7.827-19.563.719-30.019 21.495-36.258 33.909-1.917 3.802-3.426 6.801-4.912 8.773-2.572 3.403-5.859 6.235-9.327 8.598l-18.129-.069c6.008-2.141 15.655-6.45 20.938-13.441zM329.996 120.276c-6.388-7.516-10.659-19.011-12.71-34.363-2.322-17.27-15.02-24.958-26.139-26.383l1.05-8.101c14.112 1.82 30.241 11.55 33.18 33.402 2.274 16.95 7.465 28.728 15.027 34.048.836.6 1.653 1.059 2.461 1.448l-12.869-.051zM470.34 106.228c-3.44.919-55.58 2.345-82.052 2.237-15.413-.06-16.98-.589-17.497-.766-5.859-1.978-24.712-25.548-28.144-31.313-3.598-6.063-9.438-17.65-9.8-22.961-.24-3.556-.24-24.034-.214-37.399l1.36-.009c-.023 13.347-.023 33.848.214 37.316.32 4.81 5.813 15.965 9.614 22.358 3.282 5.52 21.922 28.871 27.41 30.724.691.237 3.84.641 17.061.691h.005c27.688.112 78.658-1.378 81.694-2.195 3.691-.989 14.647-17.827 15.427-24.985.557-5.145 1.783-24.568 2.414-34.884l1.328.543c-.636 10.432-1.838 29.396-2.386 34.494-.798 7.319-11.866 24.918-16.434 26.149z\" fill=\"#231f20\"/><path fill=\"#231f20\" d=\"M639.77 77.231l-463.784-1.848.013-4.085 461.425 1.838z\"/><path fill=\"#fafafa\" fill-opacity=\".78\" d=\"M176.004 69.664l3.431-.673.627-1.658 455.087 1.811 2.331 4.095L176 71.4z\"/><path d=\"M233.646 103.861c-.084 20.046 16.11 36.363 36.16 36.447 20.047.079 36.365-16.114 36.444-36.16.078-20.051-16.105-36.369-36.15-36.447-20.057-.08-36.38 16.109-36.454 36.16z\" fill=\"#251f1f\"/><path d=\"M243.376 103.898c-.056 14.67 11.792 26.61 26.472 26.67 14.67.057 26.611-11.787 26.667-26.457.06-14.67-11.788-26.619-26.458-26.675-14.675-.061-26.62 11.791-26.68 26.462z\" fill=\"#c2c2c2\"/><path d=\"M251.9 103.93c-.037 9.967 8.014 18.082 17.976 18.124 9.973.037 18.078-8.013 18.12-17.98.042-9.967-8.008-18.082-17.97-18.119-9.974-.043-18.084 8.007-18.126 17.975z\" fill=\"#efefef\"/><path d=\"M212.346 48.815c.511 3.426 4.191 3.203 4.191 3.203l95.817-7.149L324.1 21.072 215.54 43.946c0-.001-3.806.783-3.193 4.869z\"/><path d=\"M299.253 42.942c-.014 2.953 2.303 5.348 5.177 5.357 2.87.014 5.204-2.363 5.214-5.316l.042-9.424c.014-2.953-2.308-5.348-5.177-5.362-2.869-.009-5.209 2.368-5.219 5.32l-.037 9.425zM284.89 45.602c-.015 2.953 2.303 5.348 5.176 5.362 2.865.009 5.205-2.368 5.214-5.32l.037-9.424c.014-2.948-2.308-5.348-5.172-5.357-2.873-.014-5.209 2.372-5.218 5.315l-.037 9.424zM270.521 48.272c-.014 2.948 2.308 5.343 5.177 5.357 2.87.009 5.21-2.368 5.218-5.316l.037-9.424c.01-2.948-2.303-5.353-5.17-5.362-2.88-.014-5.21 2.373-5.225 5.32l-.037 9.425z\" fill=\"#0776c7\"/><path d=\"M322.945 12.553a2.4 2.4 0 0 0 2.391 2.41l19.238.079a2.404 2.404 0 1 0 .023-4.809l-19.243-.079a2.402 2.402 0 0 0-2.409 2.399zM325.976 3.649a2.973 2.973 0 0 0 2.967 2.985l11.318.046a2.971 2.971 0 0 0 2.985-2.962 2.967 2.967 0 0 0-2.962-2.99L328.966.682a2.98 2.98 0 0 0-2.99 2.967z\" fill=\"#949494\"/><path d=\"M331.798 7.288a2.629 2.629 0 0 1 2.637-2.619 2.62 2.62 0 0 1 2.608 2.637l-.009 3.389a2.626 2.626 0 0 1-2.632 2.614 2.614 2.614 0 0 1-2.614-2.632l.01-3.389z\" fill=\"#949494\"/><path d=\"M179.435 68.991l9.002-23.932s5.636-1.857 13.955-4.368l-.26 64.358-1.606-.358-24.577-20.645.056-14.382 3.43-.673z\" fill=\"#d1d1d1\"/><path fill=\"#251f1f\" d=\"M203.009 75.175l-27.725-.11-.049 12.078 27.725.111z\"/><g><path d=\"M210.517 110.378c.056-1.477 1.643-36.764 35.668-47.205 8.844-2.711 19.494-2.878 29.796-3.041 12.721-.2 25.873-.409 36.996-5.269 22.2-9.721 23.594-41.406 23.64-42.748l-13.603-.506c-.009.246-1.142 24.499-15.5 30.784-8.613 3.765-19.844 3.941-31.752 4.132-11.244.172-22.878.357-33.565 3.64-34.8 10.673-44.837 43.806-45.287 59.832l13.607.381z\" fill=\"#949494\"/><path d=\"M328.441 17.079c-.014.242-1.146 24.499-15.51 30.784-8.607 3.76-19.848 3.941-31.746 4.123-11.244.181-22.878.367-33.574 3.644-31.328 9.61-42.545 37.39-44.81 54.54l-5.892-.172c.45-16.025 10.487-49.159 45.287-59.832 10.688-3.282 22.321-3.468 33.565-3.64 11.908-.19 23.14-.367 31.751-4.132 14.36-6.286 15.492-30.538 15.501-30.784l13.603.506c-.009.311-.098 2.293-.51 5.241l-7.665-.278z\" fill=\"#f6f6f6\"/></g><path d=\"M10.947 76.515c7.943-10.524-.976-25.297-.976-25.297s15.864 9.248 18.491 23.352c2.628 14.104 1.686 23.334 15.293 30.214 9.002 4.55 17.321 2.762 22.66-3.937 5.339-6.699-6.146-15.558-5.841-15.57 16.807-.67 27.289 16.42 36.003 22.381 9.74 6.666 14.796 3.45 16.467-4.438 2.345-11.105-17.437-33.515-17.437-33.515s23.063 4.735 42.813 30.167c6.352 8.181 26.546 22.901 26.277.976-.14-10.905-5.984-19.536-5.841-19.467 24.095 11.52 30.391 42.104 44.764 45.738 14.363 3.635 17.414 4.317 22.377 1.945 4.967-2.372-4.912-17.038-4.731-16.922 17.99 11.421 14.917 17.367 24.192 22.762 9.281 5.396 13.9 5.404 13.9 5.404H20.148C10.979 121.108 4.164 100.573 0 79.088c4.364 1.095 8.426.77 10.947-2.573z\" fill=\"#ff9100\"/><path d=\"M13.491 82.166s11.736 4.345 18.69 37.813c3.584 17.261 34.132 12.251 36.072 10.432 13.473-12.604 4.912-24.769 5.219-24.772 16.806-.209 16.949 15.645 33.899 26.51 8.385 5.375 19.063 1.935 20.863-.433 8.255-10.864-6.086-30.423-6.086-30.423s11.917 5.747 24.341 26.077c4.777 7.822 22.451 9.1 25.641 3.041 4.345-8.26-4.489-16.537-4.351-16.514 24.095 3.593 19.731 22.465 34.1 23.598 14.368 1.138 17.414 1.352 22.382.608 4.967-.743 5.079-9.53 5.236-9.429 6.087 3.908 4.949 9.568 14.225 11.253 9.278 1.681 13.897 1.686 13.897 1.686H20.769a253.704 253.704 0 0 1-9.415-22.075c5.034-8.524 2.137-37.372 2.137-37.372z\" fill=\"#ff0\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "height": "141.613", "viewBox": "0 0 649.54633 141.61305", "width": "649.546" } }, "folder": { "content": "<path d=\"M366.073 96.03h-348.2c-17.7 0-18.6 9.2-17.6 20.5l13 183c.9 11.2 3.5 20.5 21.1 20.5h316.2c18 0 20.1-9.2 21.1-20.5l12.1-185.3c.9-11.2 0-18.2-17.7-18.2zM362.173 47.33c-.5-12.4-4.5-15.3-15.1-15.3h-143.2c-21.8 0-24.4.3-40.9-17.4-13.7-14.8-8.3-14.6-36.6-14.6h-75.3c-17.4 0-23.6-1.5-25.2 16.6-1.5 16.7-5 57.2-5.5 63.4h343.4l-1.6-32.7z\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "height": "320.03", "viewBox": "0 0 384.00604 320.03033", "width": "384.006" } }, "hamburger": { "content": "<title/><path d=\"M0 2h25v4H0V2zm0 8h25v4H0v-4zm0 8h25v4H0v-4z\" fill=\"#000\" fill-rule=\"evenodd\"/>", "attrs": { "height": "25", "viewBox": "0 0 25 25", "width": "25", "xmlns": "http://www.w3.org/2000/svg" } }, "hat": { "content": "<path d=\"M22 6L11 0 0 6l11 6z\"/><path d=\"M4 14.2l7 3.8 7-3.8V9.8L11 14 4 9.8zM20 6h2v8h-2z\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "version": "1", "viewBox": "0 0 22 18", "width": "22", "height": "18" } }, "office": { "content": "<path class=\"fil0\" d=\"M0 301h204v-84h50v84h37L289 0 124 78l2-59L0 82v219zm43-160h50v49H43v-49zm81 0h49v49h-49v-49zm80 0h50v49h-50v-49z\"/>", "attrs": { "height": "30.433", "viewBox": "0 0 291 301", "width": "29.378", "xmlns": "http://www.w3.org/2000/svg", "shape-rendering": "geometricPrecision", "text-rendering": "geometricPrecision", "image-rendering": "optimizeQuality", "fill-rule": "evenodd", "clip-rule": "evenodd" } }, "rss": { "content": "<path d=\"M24.625 0C11.025 0 0 11.025 0 24.625 0 38.227 11.024 49.25 24.625 49.25c13.602 0 24.625-11.023 24.625-24.625C49.25 11.025 38.226 0 24.625 0zm-7.637 35.735a3.238 3.238 0 1 1 .002-6.476 3.238 3.238 0 0 1-.002 6.476zm8.123.021c0-3.057-1.182-5.928-3.33-8.082a11.247 11.247 0 0 0-8.028-3.342v-4.674c8.84 0 16.03 7.223 16.03 16.098h-4.672zm8.256.004c0-10.867-8.795-19.711-19.606-19.711v-4.676c13.387 0 24.28 10.942 24.28 24.387h-4.674z\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "height": "49.25", "viewBox": "0 0 49.249999 49.249999", "width": "49.25" } }, "triangle-down": { "content": "<path d=\"M2.9 24.7l1.8 2.1 136 156.5c4.6 5.3 11.5 8.6 19.2 8.6 7.7 0 14.6-3.4 19.2-8.6L315 27.1l2.3-2.6C319 22 320 19 320 15.8 320 7.1 312.6 0 303.4 0H16.6C7.4 0 0 7.1 0 15.8c0 3.3 1.1 6.4 2.9 8.9z\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "height": "191.9", "viewBox": "0 0 320 191.89999", "width": "320" } }, "perforce": { "content": "<title>Perforce</title><desc>Perforce logo</desc><path d=\"M3.4 15.82c-.42 0-.77-.35-.77-.77V4.01c0-.42.35-.77.77-.77h4.92c3.58 0 6.47 2.24 6.61 5.97-.14 3.81-3.03 6.61-6.57 6.61zM1.82 27.18c.37 0 .79-.19.81-.52v-7.87c0-.42.35-.77.77-.77h5.96c4.55 0 8.32-3.51 8.32-8.3 0-.09-.01-.17-.01-.26s.01-.18.01-.26c0-4.72-3.77-8.2-8.36-8.2H.78C.35 1 0 1.35 0 1.77v24.59c0 .51.5.82.93.82zM45.91 1H30.78c-.43 0-.78.35-.78.77v24.59c0 .43.35.77.78.77h15.13c.42 0 .77-.34.77-.77v-.52c0-.42-.35-.77-.77-.77H33.44c-.43 0-.78-.34-.78-.77v-8.76c0-.43.35-.77.78-.77H44.1c.42 0 .77-.35.77-.77v-.04c0-.08 0 0 .01-.2-.02-.25-.01-.2-.01-.28v-.04a.77.77 0 0 0-.77-.77H33.44c-.43 0-.78-.34-.78-.77V3.87c0-.43.35-.77.78-.77h12.47c.42 0 .77-.35.77-.77v-.56c0-.42-.35-.77-.77-.77M62.44 15.05c-.43 0-.78-.35-.78-.77V3.98c0-.43.35-.77.78-.77h6.11c3.49 0 5.96 2.22 6.11 5.56-.15 3.49-2.62 6.28-6.08 6.28zm-1.51 12.08c.43 0 .7-.22.7-.47v-8.64c0-.42.34-.77.77-.77h6.14c.25.03.48.17.61.39l5.06 9.05c.18.33.33.44.77.44h1.94s.79 0 .17-1.18l-4.95-8.68.04.06c-.24-.42.36-.62.36-.62 2.93-.95 5.19-4.53 5.07-8.04.09-2.8-1.27-5.64-4.98-7.14-.19-.08-1.41-.53-3.49-.53h-9.66c-.3 0-.48.22-.48.47v24.89c0 .43.35.77.78.77zM92.66 27.13h.37c.37 0 .6-.22.6-.47V16.52c0-.42.35-.76.77-.76h10.99c.56 0 .48-.66.48-1.07v-.02c.01-.17 0-.35 0-.5 0-.26-.22-.48-.48-.48H94.4a.77.77 0 0 1-.77-.77V3.87c0-.43.35-.77.77-.77h12.51c.42 0 .77-.35.77-.77v-.56c0-.42-.35-.77-.77-.77H91.78c-.43 0-.78.35-.78.77v24.59c0 .43.35.77.78.77h.37zM119.57 10.5c.2-.52.43-1.02.7-1.49-.26-.24-.91-.75-.87-.79 3.39-4.06 7.81-5.28 11.72-4.57.8.11 1.6.3 2.39.59 5.6 2.08 8.43 8.25 6.33 13.79-.21.55-.47 1.08-.75 1.57.31.27.99.77.95.81-3.76 4.45-8.77 5.48-12.94 4.24-.4-.1-.8-.22-1.2-.36-5.59-2.08-8.43-8.25-6.33-13.79zm19.1-9.5c-.71.68-1.56 1.5-1.98 1.87-.66-.37-1.37-.71-2.11-.98-6.36-2.36-13.06.31-16.75 5.28-1.93 2.85-3.07 6.36-2.79 9.97 0 0 .01 6.79 6.28 10.79.51-.7 1.16-1.6 1.59-2.18.7.4 1.44.76 2.22 1.05 7.2 2.67 15.18-.74 17.79-7.61 0 0 1.91-4.19 1.28-8.77 0 0-.49-6.18-5.53-9.42zM158.44 15.05c-.43 0-.78-.35-.78-.77V3.98c0-.43.35-.77.78-.77h6.11c3.49 0 5.96 2.22 6.11 5.56-.15 3.49-2.62 6.28-6.08 6.28zm-1.51 12.08c.43 0 .7-.22.7-.47v-8.64c0-.42.35-.77.77-.77h6.14c.25.03.48.17.61.39l5.05 9.05c.19.33.34.44.78.44h1.94s.79 0 .17-1.18l-4.95-8.68.04.06c-.24-.42.36-.62.36-.62 2.93-.95 5.19-4.53 5.07-8.04.09-2.8-1.27-5.64-4.98-7.14-.19-.08-1.41-.53-3.49-.53h-9.66c-.3 0-.48.22-.48.47v24.89c0 .43.35.77.78.77zM209.02 21.87c.3.27.92.95.29 1.45-2.75 2.15-5.74 3.55-9.03 3.55-.16 0-.31-.01-.46-.02-.14.01-.28.02-.43.02-7.4 0-13.39-5.78-13.39-13.14 0-.09.01-.17.01-.26s-.01-.17-.01-.26C186 5.89 191.99 0 199.39 0c.12 0 .22.01.33.01.19 0 .37-.01.56-.01 3.77 0 6.58 1.24 8.99 3.4.75.63.04 1.19.04 1.19l-.57.54c-.22.22-.83.7-1.11.44-.35-.34-.43-.4-.43-.4l.43.4c-.35-.32-.18-.17-.43-.4-2-1.77-4.51-2.87-7.35-2.98-6.18.23-10.97 5.21-11.11 11.28.14 6.03 4.93 10.97 11.1 11.2 2.96-.11 5.24-1.31 7.36-3.05 0 0 .91-.7 1.82.25M236.91 1h-15.13c-.43 0-.78.35-.78.77v24.59c0 .43.35.77.78.77h15.13c.43 0 .78-.34.78-.77v-.52c0-.42-.35-.77-.78-.77h-12.47c-.43 0-.78-.34-.78-.77v-8.76c0-.43.35-.77.78-.77h10.66c.42 0 .77-.35.77-.77v-.04c0-.08 0 0 .01-.2-.01-.25-.01-.2-.01-.28v-.04a.77.77 0 0 0-.77-.77h-10.66c-.43 0-.78-.34-.78-.77V3.87c0-.43.35-.77.78-.77h12.47c.43 0 .78-.35.78-.77v-.56c0-.42-.35-.77-.78-.77\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "width": "238", "height": "28", "viewBox": "0 0 238 28" } }, "perforce-logo": { "content": "<title>Fill 1</title><path d=\"M3.4 15.82c-.42 0-.77-.35-.77-.77V4.01c0-.42.35-.77.77-.77h4.92c3.58 0 6.47 2.24 6.61 5.97-.14 3.81-3.03 6.61-6.57 6.61zM1.82 27.18c.37 0 .79-.19.81-.52v-7.87c0-.42.35-.77.77-.77h5.96c4.55 0 8.32-3.51 8.32-8.3 0-.09-.01-.17-.01-.26s.01-.18.01-.26c0-4.72-3.77-8.2-8.36-8.2H.78C.35 1 0 1.35 0 1.77v24.59c0 .51.5.82.93.82zM45.91 1H30.78c-.43 0-.78.35-.78.77v24.59c0 .43.35.77.78.77h15.13c.42 0 .77-.34.77-.77v-.52c0-.42-.35-.77-.77-.77H33.44c-.43 0-.78-.34-.78-.77v-8.76c0-.43.35-.77.78-.77H44.1c.42 0 .77-.35.77-.77v-.04c0-.08 0 0 .01-.2-.02-.25-.01-.2-.01-.28v-.04a.77.77 0 0 0-.77-.77H33.44c-.43 0-.78-.34-.78-.77V3.87c0-.43.35-.77.78-.77h12.47c.42 0 .77-.35.77-.77v-.56c0-.42-.35-.77-.77-.77M62.44 15.05c-.43 0-.78-.35-.78-.77V3.98c0-.43.35-.77.78-.77h6.11c3.49 0 5.96 2.22 6.11 5.56-.15 3.49-2.62 6.28-6.08 6.28zm-1.51 12.08c.43 0 .7-.22.7-.47v-8.64c0-.42.34-.77.77-.77h6.14c.25.03.48.17.61.39l5.06 9.05c.18.33.33.44.77.44h1.94s.79 0 .17-1.18l-4.95-8.68.04.06c-.24-.42.36-.62.36-.62 2.93-.95 5.19-4.53 5.07-8.04.09-2.8-1.27-5.64-4.98-7.14-.19-.08-1.41-.53-3.49-.53h-9.66c-.3 0-.48.22-.48.47v24.89c0 .43.35.77.78.77zM92.66 27.13h.37c.37 0 .6-.22.6-.47V16.52c0-.42.35-.76.77-.76h10.99c.56 0 .48-.66.48-1.07v-.02c.01-.17 0-.35 0-.5 0-.26-.22-.48-.48-.48H94.4a.77.77 0 0 1-.77-.77V3.87c0-.43.35-.77.77-.77h12.51c.42 0 .77-.35.77-.77v-.56c0-.42-.35-.77-.77-.77H91.78c-.43 0-.78.35-.78.77v24.59c0 .43.35.77.78.77h.37zM119.57 10.5c.2-.52.43-1.02.7-1.49-.26-.24-.91-.75-.87-.79 3.39-4.06 7.81-5.28 11.72-4.57.8.11 1.6.3 2.39.59 5.6 2.08 8.43 8.25 6.33 13.79-.21.55-.47 1.08-.75 1.57.31.27.99.77.95.81-3.76 4.45-8.77 5.48-12.94 4.24-.4-.1-.8-.22-1.2-.36-5.59-2.08-8.43-8.25-6.33-13.79zm19.1-9.5c-.71.68-1.56 1.5-1.98 1.87-.66-.37-1.37-.71-2.11-.98-6.36-2.36-13.06.31-16.75 5.28-1.93 2.85-3.07 6.36-2.79 9.97 0 0 .01 6.79 6.28 10.79.51-.7 1.16-1.6 1.59-2.18.7.4 1.44.76 2.22 1.05 7.2 2.67 15.18-.74 17.79-7.61 0 0 1.91-4.19 1.28-8.77 0 0-.49-6.18-5.53-9.42zM158.44 15.05c-.43 0-.78-.35-.78-.77V3.98c0-.43.35-.77.78-.77h6.11c3.49 0 5.96 2.22 6.11 5.56-.15 3.49-2.62 6.28-6.08 6.28zm-1.51 12.08c.43 0 .7-.22.7-.47v-8.64c0-.42.35-.77.77-.77h6.14c.25.03.48.17.61.39l5.05 9.05c.19.33.34.44.78.44h1.94s.79 0 .17-1.18l-4.95-8.68.04.06c-.24-.42.36-.62.36-.62 2.93-.95 5.19-4.53 5.07-8.04.09-2.8-1.27-5.64-4.98-7.14-.19-.08-1.41-.53-3.49-.53h-9.66c-.3 0-.48.22-.48.47v24.89c0 .43.35.77.78.77zM209.02 21.87c.3.27.92.95.29 1.45-2.75 2.15-5.74 3.55-9.03 3.55-.16 0-.31-.01-.46-.02-.14.01-.28.02-.43.02-7.4 0-13.39-5.78-13.39-13.14 0-.09.01-.17.01-.26s-.01-.17-.01-.26C186 5.89 191.99 0 199.39 0c.12 0 .22.01.33.01.19 0 .37-.01.56-.01 3.77 0 6.58 1.24 8.99 3.4.75.63.04 1.19.04 1.19l-.57.54c-.22.22-.83.7-1.11.44-.35-.34-.43-.4-.43-.4l.43.4c-.35-.32-.18-.17-.43-.4-2-1.77-4.51-2.87-7.35-2.98-6.18.23-10.97 5.21-11.11 11.28.14 6.03 4.93 10.97 11.1 11.2 2.96-.11 5.24-1.31 7.36-3.05 0 0 .91-.7 1.82.25M236.91 1h-15.13c-.43 0-.78.35-.78.77v24.59c0 .43.35.77.78.77h15.13c.43 0 .78-.34.78-.77v-.52c0-.42-.35-.77-.78-.77h-12.47c-.43 0-.78-.34-.78-.77v-8.76c0-.43.35-.77.78-.77h10.66c.42 0 .77-.35.77-.77v-.04c0-.08 0 0 .01-.2-.01-.25-.01-.2-.01-.28v-.04a.77.77 0 0 0-.77-.77h-10.66c-.43 0-.78-.34-.78-.77V3.87c0-.43.35-.77.78-.77h12.47c.43 0 .78-.35.78-.77v-.56c0-.42-.35-.77-.78-.77\" fill=\"#404040\"/>", "attrs": { "xmlns": "http://www.w3.org/2000/svg", "width": "238", "height": "28", "viewBox": "0 0 238 28" } } };
});

define('lolma-us/instance-initializers/clear-double-boot', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: "clear-double-boot",

    initialize: function initialize(instance) {
      if (typeof FastBoot === 'undefined') {
        var originalDidCreateRootView = instance.didCreateRootView;

        instance.didCreateRootView = function () {
          var elements = document.querySelectorAll(instance.rootElement + ' .ember-view');
          for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            element.parentNode.removeChild(element);
          }

          originalDidCreateRootView.apply(instance, arguments);
        };
      }
    }
  };
});

define('lolma-us/instance-initializers/ember-data-fastboot', ['exports', 'npm:lodash'], function (exports, _npmLodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function initialize(applicationInstance) {
    var shoebox = applicationInstance.lookup('service:fastboot').get('shoebox');
    if (!shoebox) return;

    var data = shoebox.retrieve('ember-data-store');
    if (!data) return;

    var store = applicationInstance.lookup('service:store');

    _npmLodash.default.forOwn(data.types, function (records, modelName) {
      var payload = _defineProperty({}, modelName, records);
      store.pushPayload(modelName, payload);
    });
  }

  exports.default = {
    name: 'ember-data-fastboot',
    initialize: initialize
  };
});

define("lolma-us/instance-initializers/ember-data", ["exports", "ember-data/initialize-store-service"], function (exports, _initializeStoreService) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: "ember-data",
    initialize: _initializeStoreService.default
  };
});

define('lolma-us/instance-initializers/ember-i18n', ['exports', 'ember-i18n/instance-initializers/ember-i18n'], function (exports, _emberI18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberI18n.default;
});

define('lolma-us/instance-initializers/ember-simple-auth', ['exports', 'ember-simple-auth/instance-initializers/setup-session-restoration'], function (exports, _setupSessionRestoration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize: function initialize(instance) {
      (0, _setupSessionRestoration.default)(instance);
    }
  };
});

define('lolma-us/instance-initializers/head-browser', ['exports', 'lolma-us/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = undefined;
  function _initialize() {
    if (_environment.default['ember-cli-head'] && _environment.default['ember-cli-head']['suppressBrowserRender']) {
      return true;
    }

    // clear fast booted head (if any)
    var startMeta = document.querySelector('meta[name="ember-cli-head-start"]');
    var endMeta = document.querySelector('meta[name="ember-cli-head-end"]');
    if (startMeta && endMeta) {
      var el = startMeta.nextSibling;
      while (el && el !== endMeta) {
        document.head.removeChild(el);
        el = startMeta.nextSibling;
      }
      document.head.removeChild(startMeta);
      document.head.removeChild(endMeta);
    }
  }

  exports.initialize = _initialize;
  exports.default = {
    name: 'head-browser',
    initialize: function initialize() {
      if (typeof FastBoot === 'undefined') {
        _initialize.apply(undefined, arguments);
      }
    }
  };
});

define('lolma-us/instance-initializers/rollbar', ['exports', 'ember-rollbar-client/instance-initializers/rollbar'], function (exports, _rollbar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rollbar.default;
    }
  });
  Object.defineProperty(exports, 'initialize', {
    enumerable: true,
    get: function () {
      return _rollbar.initialize;
    }
  });
});

define('lolma-us/instance-initializers/rsvp-rollbar', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize(appInstance) {
    var rollbar = appInstance.lookup('service:rollbar');

    Ember.RSVP.on('error', function (reason) {
      rollbar.error(reason);
    });
  }

  exports.default = {
    name: 'rsvp-error-handler',
    initialize: initialize
  };
});

define('lolma-us/instance-initializers/save-html-state', ['exports', 'npm:lodash'], function (exports, _npmLodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;


  var items = {
    '#route-locale-menuToggler': {
      type: 'checkbox'
    },
    '.timeLine-showDetails': {
      type: 'checkbox'
    },
    '.proJects-stalledInput': {
      type: 'checkbox'
    },
    // '.route-locale-content': {
    //   type: 'vertical-scroll',
    // },
    '.route-blog-sidebar': {
      type: 'vertical-scroll'
    }
    // '.route-blog-content': {
    //   type: 'vertical-scroll',
    // },
  };

  function initialize() /*applicationInstance*/{
    if (typeof FastBoot === 'undefined') {
      _npmLodash.default.forOwn(items, function (data, selector) {
        var $el = Ember.$(selector);

        switch (data.type) {
          case 'checkbox':
            data.value = $el.is(':checked');
            break;
          case 'vertical-scroll':
            data.value = $el.scrollTop();
            break;
        }
      });

      window.lolmausHtmlState = items;
    }
  }

  exports.default = {
    name: 'save-html-state',
    initialize: initialize
  };
});

define('lolma-us/instance-initializers/setup-routes', ['exports', 'torii/bootstrap/routing', 'torii/configuration', 'torii/compat/get-router-instance', 'torii/compat/get-router-lib', 'torii/router-dsl-ext'], function (exports, _routing, _configuration, _getRouterInstance, _getRouterLib) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'torii-setup-routes',
    initialize: function initialize(applicationInstance, registry) {
      var configuration = (0, _configuration.getConfiguration)();

      if (!configuration.sessionServiceName) {
        return;
      }

      var router = (0, _getRouterInstance.default)(applicationInstance);
      var setupRoutes = function setupRoutes() {
        var routerLib = (0, _getRouterLib.default)(router);
        var authenticatedRoutes = routerLib.authenticatedRoutes;
        var hasAuthenticatedRoutes = !Ember.isEmpty(authenticatedRoutes);
        if (hasAuthenticatedRoutes) {
          (0, _routing.default)(applicationInstance, authenticatedRoutes);
        }
        router.off('willTransition', setupRoutes);
      };
      router.on('willTransition', setupRoutes);
    }
  };
});

define('lolma-us/instance-initializers/walk-providers', ['exports', 'torii/lib/container-utils', 'torii/configuration'], function (exports, _containerUtils, _configuration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'torii-walk-providers',
    initialize: function initialize(applicationInstance) {
      var configuration = (0, _configuration.getConfiguration)();
      // Walk all configured providers and eagerly instantiate
      // them. This gives providers with initialization side effects
      // like facebook-connect a chance to load up assets.
      for (var key in configuration.providers) {
        if (configuration.providers.hasOwnProperty(key)) {
          (0, _containerUtils.lookup)(applicationInstance, 'torii-provider:' + key);
        }
      }
    }
  };
});

define('lolma-us/locales/en/translations', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    refreshSuggestion: "You're viewing cached version of the website. Refresh to see the up-to-date version?",
    header: {
      title: 'Andrey Mikhaylov',
      subtitle: 'frontend&nbsp;developer, EmberJS&nbsp;enthusiast',
      footer: 'Working with an amazing team at <a href="https://deveo.com/">Deveo.com</a> — repository management platform done right.</a>'
    },
    menu: {
      greeting: 'You are awesome today!',
      source: 'Source on GitHub',
      blog: 'Blog',
      resume: 'Résumé'
    },
    langSwitcher: 'Моя не понимать',
    login: {
      logIn: 'Log in',
      withGitHub: 'with GitHub to star projects',
      logOut: 'Log out',
      loggingIn: 'Logging in...',
      welcome: 'This is an external link to GitHub.\n\nLog into GitHub to be able to star projects without leaving this website.',
      goodbye: "You're logged in! This button will toggle the star via GitHub API."
    },
    onlinePresence: {
      title: 'Online presence'
    },
    projects: {
      title: 'Open Source Contributions',
      showStalled: 'Show stalled projects',
      sassLibs: 'Sass Libraries',
      emberAddons: 'Ember Addons',
      emberApps: 'Ember Apps',
      jsLibs: 'JavaScript Libraries',
      jQueryPlugins: 'Old jQuery Plugins'
    },
    timeline: {
      title: 'Experience',
      details: 'Show details',
      present: 'present'
    },
    blog: {
      title: 'Blog',
      license: 'License'
    },
    blogIndex: {
      name: 'Blog of Andrey Mikhaylov (lolmaus)',
      description: 'Musings on web development, mostly on JavaScript and EmberJS'
    },
    blogPost: {
      back: '← To blog index',
      lastUpdatedAt: 'last updated at'
    },
    locale: {
      title: 'Andrey Mikhaylov (lolmaus)'
    },
    localeIndex: {
      title: 'Résumé',
      loginWarning: 'May I track your GitHub user id to my Google Analytics account?'
    }
  };
});

define('lolma-us/locales/ru/translations', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    refreshSuggestion: 'Вы смотрите закэшированную версию сайта. Обновить страницу, чтобы увидеть свежую версию?',
    header: {
      title: 'Андрей Михайлов',
      subtitle: 'фронтенд&#8209;разработчик, EmberJS&#8209;энтузиаст',
      footer: "Работаю с потрясающей командой в <a href='https://deveo.com'>Deveo.com</a>. Мы делаем правильную систему управления репозиториями."
    },
    menu: {
      greeting: 'Ты сегодня лучше всех!',
      source: 'Исходник на GitHub',
      blog: 'Блог',
      resume: 'Резюме'
    },
    langSwitcher: 'Switch to English',
    login: {
      logIn: 'Войти',
      withGitHub: 'через GitHub, чтобы ставить звездочки проектам, не покидая этот сайт.',
      logOut: 'Выйти',
      loggingIn: 'Заходим...',
      welcome: 'Это внешняя ссылка на GitHub.',
      goodbye: 'Вы залогинены! Звездочка будет поставлена через API GitHub.'
    },
    onlinePresence: {
      title: 'В этих ваших интернетах'
    },
    projects: {
      title: 'Вклад в Open Source',
      showStalled: 'Показывать заброшенные проекты',
      sassLibs: 'Sass-библиотеки',
      emberAddons: 'Ember-аддоны',
      emberApps: 'Приложения на Ember',
      jsLibs: 'JavaScript-библиотеки',
      jQueryPlugins: 'Старые jQuery-плагины'
    },
    timeline: {
      title: 'Опыт',
      details: 'Показывать подробности',
      present: 'н. в.'
    },
    blog: {
      title: 'Блог',
      license: 'Лицензия'
    },
    blogIndex: {
      name: 'Блог Андрея Михайлова (lolmaus)',
      description: 'Заметки о вэб-разработке, в основном о JavaScript и EmberJS'
    },
    blogPost: {
      back: '← В блог',
      lastUpdatedAt: 'обновлено'
    },
    locale: {
      title: 'Андрей Михайлов (lolmaus)'
    },
    localeIndex: {
      title: 'Резюме',
      loginWarning: 'Могу я передать ваш GitHub юзернэйм в мой аккаунт Google Analytics?'
    }
  };
});

define('lolma-us/locations/none', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = Ember.computed,
      _Ember$computed = Ember.computed,
      bool = _Ember$computed.bool,
      readOnly = _Ember$computed.readOnly,
      service = Ember.inject.service,
      get = Ember.get,
      getOwner = Ember.getOwner;


  var TEMPORARY_REDIRECT_CODE = 307;

  exports.default = Ember.NoneLocation.extend({
    implementation: 'fastboot',
    fastboot: service(),

    _config: computed(function () {
      return getOwner(this).resolveRegistration('config:environment');
    }),

    _fastbootHeadersEnabled: bool('_config.fastboot.fastbootHeaders'),

    _redirectCode: computed(function () {
      return get(this, '_config.fastboot.redirectCode') || TEMPORARY_REDIRECT_CODE;
    }),

    _response: readOnly('fastboot.response'),
    _request: readOnly('fastboot.request'),

    setURL: function setURL(path) {
      if (get(this, 'fastboot.isFastBoot')) {
        var response = get(this, '_response');
        var currentPath = get(this, 'path');
        var isInitialPath = !currentPath || currentPath.length === 0;

        if (!isInitialPath) {
          path = this.formatURL(path);
          var isTransitioning = currentPath !== path;

          if (isTransitioning) {
            var host = get(this, '_request.host');
            var redirectURL = '//' + host + path;

            response.statusCode = this.get('_redirectCode');
            response.headers.set('location', redirectURL);
          }
        }

        // for testing and debugging
        if (get(this, '_fastbootHeadersEnabled')) {
          response.headers.set('x-fastboot-path', path);
        }
      }

      this._super.apply(this, arguments);
    }
  });
});

define('lolma-us/macros/t', ['exports', 'ember-macro-helpers/computed'], function (exports, _computed) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (key) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return (0, _computed.default)('i18n.locale', function () {
      var _get;

      return (_get = this.get('i18n')).t.apply(_get, [key].concat(args));
    });
  };
});

define('lolma-us/models/cache-buster', ['exports', 'ember-data/model', 'ember-data/attr'], function (exports, _model, _attr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _model.default.extend({

    // ----- Attributes -----
    string: (0, _attr.default)('string')

    // ----- Relationships -----
  });
});

define('lolma-us/models/experience', ['exports', 'ember-data/model', 'ember-data/attr'], function (exports, _model, _attr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _model.default.extend({

    // ----- Attributes -----
    title: (0, _attr.default)('string'),
    body: (0, _attr.default)('string'),
    type: (0, _attr.default)('string'),
    start: (0, _attr.default)('date'),
    end: (0, _attr.default)('date'),
    present: (0, _attr.default)('boolean')

    // ----- Relationships -----
  });
});

define('lolma-us/models/markdown-block', ['exports', 'ember-data/model', 'ember-data/attr'], function (exports, _model, _attr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _model.default.extend({

    // ----- Attributes -----
    title: (0, _attr.default)('string'),
    body: (0, _attr.default)('string')

    // ----- Relationships -----
  });
});

define('lolma-us/models/post', ['exports', 'ember-data/model', 'ember-data/attr', 'ember-awesome-macros', 'ember-macro-helpers/computed', 'ember-macro-helpers/reads'], function (exports, _model, _attr, _emberAwesomeMacros, _computed, _reads) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _templateObject = _taggedTemplateLiteral(['https://lolma.us/', '/blog/', '/'], ['https://lolma.us/', '/blog/', '/']),
      _templateObject2 = _taggedTemplateLiteral(['blog-', ''], ['blog-', '']);

  function _taggedTemplateLiteral(strings, raw) {
    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }

  exports.default = _model.default.extend({

    // ----- Attributes -----
    title: (0, _attr.default)('string'),
    body: (0, _attr.default)('string'),
    summary: (0, _attr.default)('string'),
    image: (0, _attr.default)('string'),
    created: (0, _attr.default)('date'),
    updated: (0, _attr.default)('date'),
    hideSummary: (0, _attr.default)('boolean'),
    dependencies: (0, _attr.default)('string'),
    proficiency: (0, _attr.default)('string'),
    keywords: (0, _attr.default)(),

    // ----- Relationships -----


    // ----- Computed properties -----
    idSegments: (0, _computed.default)('id', function (id) {
      return id.split('-');
    }),
    locale: (0, _reads.default)('idSegments.lastObject'),

    slug: (0, _computed.default)('idSegments.[]', function (segments) {
      return segments.slice(0, -1).join('-');
    }),

    url: (0, _emberAwesomeMacros.tag)(_templateObject, 'locale', 'slug'),
    disqusId: (0, _emberAwesomeMacros.tag)(_templateObject2, 'id')
  });
});

define('lolma-us/models/project-info', ['exports', 'ember-data/model', 'ember-data/attr', 'lolma-us/utils/fetch-github', 'ember-awesome-macros'], function (exports, _model, _attr, _fetchGithub, _emberAwesomeMacros) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _templateObject = _taggedTemplateLiteral(['user/starred/', ''], ['user/starred/', '']);

  function _taggedTemplateLiteral(strings, raw) {
    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }

  var PromiseProxy = Ember.Object.extend(Ember.PromiseProxyMixin);

  exports.default = _model.default.extend({

    // ----- Attributes -----
    stargazersCount: (0, _attr.default)('number'),

    // ----- Relationships -----
    // project: belongsTo('project'),


    // ----- Services -----
    session: Ember.inject.service(),

    // ----- Static properties -----


    // ----- Computed properties -----
    starUrl: (0, _emberAwesomeMacros.tag)(_templateObject, 'id'),

    isStarredPromise: Ember.computed('starUrl', 'session.isAuthenticated', function () {
      return this._requestIsStarred();
    }),
    isStarredProxy: Ember.computed('isStarredPromise', function () {
      var promise = this.get('isStarredPromise');
      return PromiseProxy.create({ promise: promise });
    }),

    toggleStarPromise: undefined,
    toggleStarProxy: Ember.computed('toggleStarPromise', function () {
      var promise = this.get('toggleStarPromise');
      if (!promise) return;
      return PromiseProxy.create({ promise: promise });
    }),

    starPromisePending: Ember.computed('session.isAuthenticated', 'isStarredProxy.isPending', 'toggleStarProxy.isPending', function () {
      if (!this.get('session.isAuthenticated')) return false;
      return this.get('isStarredProxy.isPending') || this.get('toggleStarProxy.isPending');
    }),

    starPromiseFailed: Ember.computed('session.isAuthenticated', 'isStarredProxy.isRejected', 'toggleStarProxy.isRejected', function () {
      if (!this.get('session.isAuthenticated')) return false;
      return this.get('isStarredProxy.isRejected') || this.get('toggleStarProxy.isRejected');
    }),

    originalIsStarred: Ember.computed.alias('isStarredProxy.content'),
    newIsStarred: Ember.computed.alias('toggleStarProxy.content'),

    effectiveIsStarred: Ember.computed('newIsStarred', 'originalIsStarred', function () {
      var newIsStarred = this.get('newIsStarred');
      if (newIsStarred != null) return newIsStarred;
      return this.get('originalIsStarred');
    }),

    effectiveStargazersCount: Ember.computed('stargazersCount', 'originalIsStarred', 'newIsStarred', function () {
      var stargazersCount = this.get('stargazersCount');
      var originalIsStarred = this.get('originalIsStarred');
      var newIsStarred = this.get('newIsStarred');

      if (originalIsStarred == null || newIsStarred == null || originalIsStarred === newIsStarred) return stargazersCount;

      if (originalIsStarred && !newIsStarred) return stargazersCount - 1;

      return stargazersCount + 1;
    }),

    // ----- Custom Methods -----
    _requestIsStarred: function _requestIsStarred() {
      var _this = this;

      var starUrl = this.get('starUrl');
      var session = this.get('session');

      return (0, _fetchGithub.default)(starUrl, session, { mode: false }).then(function () {
        return true;
      }).catch(function (response) {
        if (response.status === 404) return false;
        return Ember.RSVP.reject(response);
      }).then(function (status) {
        return _this.set('originalIsStarred', status);
      });
    },
    _star: function _star() {
      var starUrl = this.get('starUrl');
      var session = this.get('session');

      return (0, _fetchGithub.default)(starUrl, session, { mode: false, method: 'PUT' }).then(function () {
        return true;
      });
    },
    _unstar: function _unstar() {
      var starUrl = this.get('starUrl');
      var session = this.get('session');

      return (0, _fetchGithub.default)(starUrl, session, { mode: false, method: 'DELETE' }).then(function () {
        return false;
      });
    },
    toggleStar: function toggleStar() {
      if (this.get('isStarredProxy.isPending')) return;
      if (this.get('toggleStarProxy.isPending')) return;

      if (this.get('isStarredProxy.isRejected')) {
        var isStarredPromise = this._requestIsStarred();
        this.setProperties({ isStarredPromise: isStarredPromise });
      }

      var toggleStarPromise = this.get('effectiveIsStarred') ? this._unstar() : this._star();
      this.setProperties({ toggleStarPromise: toggleStarPromise });
    }
  });
});

define('lolma-us/models/project', ['exports', 'ember-data/model', 'ember-data/attr', 'ember-data/relationships', 'ember-awesome-macros/conditional', 'ember-awesome-macros'], function (exports, _model, _attr, _relationships, _conditional, _emberAwesomeMacros) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _templateObject = _taggedTemplateLiteral(['', '/', ''], ['', '/', '']),
      _templateObject2 = _taggedTemplateLiteral(['https://github.com/', ''], ['https://github.com/', '']);

  function _taggedTemplateLiteral(strings, raw) {
    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }

  exports.default = _model.default.extend({

    // ----- Attributes -----
    group: (0, _attr.default)('string'),
    status: (0, _attr.default)('number'),
    type: (0, _attr.default)('string'),
    owner: (0, _attr.default)('string', { defaultValue: 'lolmaus' }),
    url: (0, _attr.default)('string'),
    description: (0, _attr.default)(''),
    emberObserver: (0, _attr.default)('boolean', { defaultValue: false }),

    // ----- Relationships -----
    projectInfo: (0, _relationships.belongsTo)('project-info', { async: true }),

    // ----- Services -----


    // ----- Computed properties -----
    gitHubId: (0, _emberAwesomeMacros.tag)(_templateObject, 'owner', 'id'),
    gitHubUrl: (0, _emberAwesomeMacros.tag)(_templateObject2, 'gitHubId'),
    effectiveUrl: (0, _conditional.default)('url', 'url', 'gitHubUrl'),
    effectiveName: (0, _conditional.default)('name', 'name', 'id'),

    // Return projectInfo without triggering a fetch
    projectInfoSync: Ember.computed(function () {
      return this.belongsTo('projectInfo').value();
    }).volatile()
  });
});

define('lolma-us/models/stackoverflow-user', ['exports', 'ember-data/model', 'ember-data/attr'], function (exports, _model, _attr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _model.default.extend({

    // ----- Attributes -----
    reputation: (0, _attr.default)('number'),
    bronze: (0, _attr.default)('number'),
    silver: (0, _attr.default)('number'),
    gold: (0, _attr.default)('number')
  });
});

define('lolma-us/pods/application/route', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({

    // ----- Services -----


    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    title: function title(tokens) {
      return tokens.reverse().join(' | ');
    }
  }

  // ----- Custom Methods -----


  // ----- Events and observers -----


  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define("lolma-us/pods/application/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LCiHorAA", "block": "{\"symbols\":[],\"statements\":[[1,[18,\"head-layout\"],false],[0,\"\\n\\n\"],[1,[18,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/application/template.hbs" } });
});

define('lolma-us/pods/components/blog-post/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    post: undefined,
    summary: false,

    // ----- Services -----


    // ----- Overridden properties -----
    classNameBindings: [':blogPost', 'summary:-summary:-full']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/blog-post/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ty9KmDaG", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[20,[\"summary\"]]],null,{\"statements\":[[0,\"  \"],[6,\"h2\"],[9,\"class\",\"blogPost-title\"],[7],[0,\"\\n    \"],[4,\"link-to\",[\"locale.blog.post\",[20,[\"post\",\"slug\"]]],[[\"class\"],[\"blogPost-title-link\"]],{\"statements\":[[1,[20,[\"post\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n  \"],[8],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[1,[25,\"markdown-to-html\",[[20,[\"post\",\"title\"]]],[[\"class\",\"tagName\"],[\"blogPost-title\",\"h1\"]]],false],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\\n\\n\"],[6,\"p\"],[9,\"class\",\"blogPost-date\"],[7],[0,\"\\n  \"],[1,[25,\"moment-format\",[[20,[\"post\",\"created\"]],\"Do MMMM YYYY\"],null],false],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"post\",\"updated\"]]],null,{\"statements\":[[0,\"    (\"],[1,[25,\"t\",[\"blogPost.lastUpdatedAt\"],null],false],[0,\" \"],[1,[25,\"moment-format\",[[20,[\"post\",\"updated\"]],\"Do MMMM YYYY\"],null],false],[0,\")\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\\n\"],[4,\"if\",[[25,\"and\",[[20,[\"post\",\"summary\"]],[25,\"or\",[[20,[\"summary\"]],[25,\"not\",[[20,[\"post\",\"hideSummary\"]]],null]],null]],null]],null,{\"statements\":[[0,\"  \"],[1,[25,\"markdown-to-html\",[[20,[\"post\",\"summary\"]]],[[\"class\"],[\"blogPost-summary\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\\n\\n\"],[4,\"if\",[[25,\"and\",[[20,[\"post\",\"body\"]],[25,\"not\",[[20,[\"summary\"]]],null]],null]],null,{\"statements\":[[0,\"  \"],[1,[25,\"markdown-to-html\",[[20,[\"post\",\"body\"]]],[[\"class\",\"extensions\"],[\"blogPost-body\",\"codehighlight linkable-headers\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/blog-post/template.hbs" } });
});

define('lolma-us/pods/components/hero-header/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    scrollToTarget: '#content',

    // ----- Services -----


    // ----- Overridden properties -----
    classNames: ['heroHeader']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/hero-header/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "qe3I2h1r", "block": "{\"symbols\":[],\"statements\":[[4,\"sec-tion\",null,[[\"class\",\"innerClass\"],[\"heroHeader-inner\",\"heroHeader-inner2\"]],{\"statements\":[[0,\"\\n  \"],[6,\"div\"],[9,\"class\",\"heroHeader-header\"],[7],[0,\"\\n    \"],[6,\"h1\"],[9,\"class\",\"heroHeader-title h1\"],[7],[0,\"\\n      \"],[1,[25,\"t\",[\"header.title\"],null],false],[0,\" (lolmaus)\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"h2\"],[9,\"class\",\"heroHeader-subtitle\"],[7],[0,\"\\n      \"],[1,[25,\"t\",[\"header.subtitle\"],null],false],[0,\"\\n    \"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"img\"],[9,\"class\",\"heroHeader-avatar\"],[9,\"src\",\"/favicon.jpg\"],[9,\"alt\",\"My face\"],[9,\"width\",\"512\"],[9,\"height\",\"512\"],[7],[8],[0,\"\\n\\n\\n  \"],[6,\"div\"],[9,\"class\",\"heroHeader-footer\"],[7],[0,\"\\n    \"],[6,\"div\"],[9,\"class\",\"heroHeader-footer-main\"],[7],[0,\"\\n      \"],[6,\"div\"],[9,\"class\",\"heroHeader-footer-main-message\"],[7],[0,\"\\n\"],[0,\"\\n        Working with an amazing team at\\n\\n        \"],[6,\"a\"],[9,\"class\",\"heroHeader-footer-main-stamp -no-icon\"],[9,\"href\",\"https://deveo.com\"],[7],[0,\"\\n          \"],[1,[25,\"svg-jar\",[\"perforce\"],[[\"class\"],[\"heroHeader-footer-main-stamp-image\"]]],false],[0,\"\\n        \"],[8],[0,\"\\n\\n        — repository management platform done right\\n      \"],[8],[0,\"\\n    \"],[8],[0,\"\\n\\n\"],[4,\"scroll-to\",null,[[\"class\",\"target\"],[\"heroHeader-scrollTo\",[20,[\"scrollToTarget\"]]]],{\"statements\":[[0,\"      \"],[1,[25,\"svg-jar\",[\"triangle-down\"],[[\"class\"],[\"heroHeader-scrollTo-icon\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[8],[0,\"\\n\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/hero-header/template.hbs" } });
});

define('lolma-us/pods/components/horizontal-menu/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----


    // ----- Services -----
    routing: Ember.inject.service('-routing'),

    // ----- Overridden properties -----
    classNames: ['horizontalMenu']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/horizontal-menu/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Xmu/bL+T", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"horizontalMenu-item _blog\"],[7],[0,\"\\n  \"],[4,\"link-to\",[\"locale.blog\"],[[\"class\"],[\"horizontalMenu-item-link\"]],{\"statements\":[[1,[25,\"t\",[\"menu.blog\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\"],[6,\"div\"],[9,\"class\",\"horizontalMenu-item _resume\"],[7],[0,\"\\n  \"],[4,\"link-to\",[\"locale.index\"],[[\"class\"],[\"horizontalMenu-item-link\"]],{\"statements\":[[1,[25,\"t\",[\"menu.resume\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\"],[6,\"div\"],[9,\"class\",\"horizontalMenu-item _source\"],[7],[0,\"\\n  \"],[6,\"a\"],[9,\"href\",\"https://github.com/lolmaus/lolma.us\"],[9,\"class\",\"horizontalMenu-item-link -no-icon -has-inner\"],[7],[0,\"\\n    \"],[6,\"span\"],[9,\"class\",\"horizontalMenu-item-link-inner\"],[7],[1,[25,\"t\",[\"menu.source\"],null],false],[8],[6,\"span\"],[9,\"class\",\"externalLink\"],[7],[8],[0,\"\\n  \"],[8],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\"],[6,\"div\"],[9,\"class\",\"horizontalMenu-item _locale\"],[7],[0,\"\\n\"],[4,\"link-to\",null,[[\"class\",\"params\"],[\"horizontalMenu-item-link\",[20,[\"routing\",\"router\",\"oppositeLocaleURLParams\"]]]],{\"statements\":[[0,\"    \"],[1,[25,\"t\",[\"langSwitcher\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/horizontal-menu/template.hbs" } });
});

define('lolma-us/pods/components/markdown-block/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    section: undefined, // title, body


    // ----- Services -----


    // ----- Overridden properties -----
    classNames: ['markdownBlock']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/markdown-block/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "GB82xRvQ", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[20,[\"section\",\"title\"]]],null,{\"statements\":[[0,\"  \"],[6,\"h2\"],[9,\"class\",\"markdownBlock-title -callout\"],[7],[0,\"\\n    \"],[1,[20,[\"section\",\"title\"]],false],[0,\"\\n  \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[20,[\"section\",\"body\"]]],null,{\"statements\":[[0,\"  \"],[1,[25,\"markdown-to-html\",[[20,[\"section\",\"body\"]]],[[\"class\"],[\"markdownBlock-body\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/markdown-block/template.hbs" } });
});

define('lolma-us/pods/components/online-presence/component', ['exports', 'ember-awesome-macros', 'ember-awesome-macros/array', 'ember-macro-helpers/raw'], function (exports, _emberAwesomeMacros, _array, _raw) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    projectInfos: undefined,
    stackoverflowUser: undefined,

    // ----- Services -----


    // ----- Overridden properties -----
    classNames: ['onlinePresence'],

    // ----- Static properties -----


    // ----- Computed properties -----
    starsCount: (0, _emberAwesomeMacros.sum)((0, _array.mapBy)('projectInfos', (0, _raw.default)('stargazersCount')))

    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/online-presence/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zkdB0MiY", "block": "{\"symbols\":[],\"statements\":[[6,\"h2\"],[9,\"class\",\"onlinePresence-title -callout\"],[7],[0,\"\\n  \"],[1,[25,\"t\",[\"onlinePresence.title\"],null],false],[0,\"\\n\"],[8],[0,\"\\n\\n\"],[6,\"ul\"],[9,\"class\",\"onlinePresence-list\"],[7],[0,\"\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"class\",\"onlinePresence-item-icon\"],[9,\"src\",\"/images/service-icons/github.png\"],[9,\"width\",\"16\"],[9,\"height\",\"16\"],[9,\"alt\",\"GitHub\"],[7],[8],[0,\"\\n\\n    \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-service\"],[7],[0,\"\\n      GitHub:\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"a\"],[9,\"href\",\"https://github.com/lolmaus\"],[7],[0,\"lolmaus\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"projectInfos\"]]],null,{\"statements\":[[0,\"      \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-meta\"],[7],[0,\"\\n        ★\"],[1,[18,\"starsCount\"],false],[0,\"\\n      \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item _so\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"src\",\"/images/service-icons/stackoverflow.png\"],[9,\"width\",\"16\"],[9,\"height\",\"16\"],[9,\"alt\",\"StackOverflow\"],[7],[8],[0,\"\\n\\n\"],[0,\"\\n    \"],[6,\"a\"],[9,\"href\",\"https://stackoverflow.com/users/901944/lolmaus-andrey-mikhaylov\"],[7],[0,\"StackOverflow\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"stackoverflowUser\"]]],null,{\"statements\":[[0,\"      \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-meta onlinePresence-item-so-stats\"],[7],[0,\"\\n        \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-so-stats-reputation\"],[7],[0,\"\\n          \"],[1,[20,[\"stackoverflowUser\",\"reputation\"]],false],[0,\"\\n        \"],[8],[0,\"\\n\\n        \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-so-stats-badges\"],[7],[0,\"\\n          \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-so-stats-badge _gold\"],[7],[0,\"\\n            \"],[1,[20,[\"stackoverflowUser\",\"gold\"]],false],[0,\"\\n          \"],[8],[0,\"\\n\\n          \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-so-stats-badge _silver\"],[7],[0,\"\\n            \"],[1,[20,[\"stackoverflowUser\",\"silver\"]],false],[0,\"\\n          \"],[8],[0,\"\\n\\n          \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-so-stats-badge _bronze\"],[7],[0,\"\\n            \"],[1,[20,[\"stackoverflowUser\",\"bronze\"]],false],[0,\"\\n          \"],[8],[0,\"\\n        \"],[8],[0,\"\\n      \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"src\",\"/images/service-icons/twitter.png\"],[9,\"width\",\"16\"],[9,\"height\",\"13\"],[9,\"alt\",\"Twitter\"],[7],[8],[0,\"\\n\\n    \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-service\"],[7],[0,\"\\n      Twitter:\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"a\"],[9,\"href\",\"https://twitter.com/lolmaus_en\"],[7],[0,\"@lolmaus_en\"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"src\",\"/images/service-icons/telegram.png\"],[9,\"width\",\"16\"],[9,\"height\",\"16\"],[9,\"alt\",\"Telegram\"],[7],[8],[0,\"\\n\\n    \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-service\"],[7],[0,\"\\n      Telegram:\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"a\"],[9,\"href\",\"https://telegram.me/lolmaus\"],[7],[0,\"@lolmaus\"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"src\",\"/images/service-icons/gitter.png\"],[9,\"width\",\"16\"],[9,\"height\",\"16\"],[9,\"alt\",\"Gitter\"],[7],[8],[0,\"\\n\\n    \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-service\"],[7],[0,\"\\n      Gitter:\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"a\"],[9,\"href\",\"https://gitter.im/lolmaus\"],[7],[0,\"lolmaus\"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"src\",\"/images/service-icons/ember.png\"],[9,\"width\",\"16\"],[9,\"height\",\"16\"],[9,\"alt\",\"Ember Slack Community\"],[7],[8],[0,\"\\n\\n    \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-service\"],[7],[0,\"\\n      Slack:\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"a\"],[9,\"href\",\"https://embercommunity.slack.com/messages/@lolmaus/\"],[7],[0,\"@lolmaus\"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\\n\\n  \"],[6,\"li\"],[9,\"class\",\"onlinePresence-item\"],[7],[0,\"\\n    \"],[6,\"img\"],[9,\"src\",\"/images/service-icons/email.png\"],[9,\"width\",\"16\"],[9,\"height\",\"16\"],[9,\"alt\",\"E-mail\"],[7],[8],[0,\"\\n\\n    \"],[6,\"span\"],[9,\"class\",\"onlinePresence-item-service\"],[7],[0,\"\\n      E-mail:\\n    \"],[8],[0,\"\\n\\n    \"],[6,\"a\"],[9,\"href\",\"mailto:lolmaus@gmail.com\"],[7],[0,\"lolmaus@gmail.com\"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\\n\"],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/online-presence/template.hbs" } });
});

define('lolma-us/pods/components/pro-ject/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    project: undefined,
    gitHubProjectsStats: undefined,
    locale: 'en',
    loginAction: undefined,
    isAuthenticating: undefined,
    isAuthenticated: undefined,

    // ----- Services -----
    session: Ember.inject.service(),

    // ----- Overridden properties -----
    classNameBindings: [':proJect', 'stalledClass'],

    // ----- Static properties -----
    emptyString: '',

    // ----- Computed properties -----
    currentDescription: Ember.computed('locale', 'project.description', function () {
      var locale = this.get('locale');
      var descriptionObject = this.get('project.description');
      return Ember.get(descriptionObject, locale);
    }),

    statusLabel: Ember.computed('project.status', function () {
      var status = this.get('project.status');

      return status === 2 ? 'WIP' : status === 3 ? 'PoC' : status === 4 ? 'stalled' : '';
    }),

    statusTitle: Ember.computed('project.status', function () {
      var status = this.get('project.status');

      return status === 2 ? 'Work in Progress' : status === 3 ? 'Proof of Concept' : null;
    }),

    starButtonLabel: Ember.computed('session.isAuthenticated', 'project.projectInfo.{starPromisePending,starPromiseFailed,effectiveIsStarred}', function () {
      return !this.get('session.isAuthenticated') ? 'Star' : this.get('project.projectInfo.starPromisePending') ? 'Updating...' : this.get('project.projectInfo.starPromiseFailed') ? 'Retry' : this.get('project.projectInfo.effectiveIsStarred') ? 'Unstar' : 'Star';
    }),

    starCount: Ember.computed('session.isAuthenticated', 'project.projectInfoSync', 'project.projectInfo.{stargazersCount,effectiveStargazersCount}', function () {
      if (this.get('session.isAuthenticated')) return this.get('project.projectInfo.effectiveStargazersCount');
      if (this.get('project.projectInfoSync')) return this.get('project.projectInfo.stargazersCount');
    }),

    stalledClass: Ember.computed('project.status', function () {
      return this.get('project.status') === 4 ? '-stalled' : '';
    }),

    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    actions: {
      toggleStar: function toggleStar() {
        if (!this.get('session.isAuthenticated')) {
          window.open(this.get('project.gitHubUrl'), '_blank');
          return;
        }

        this.get('project.projectInfo').then(function (project) {
          return project.toggleStar();
        });
      }
    }
  });
});

define("lolma-us/pods/components/pro-ject/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/4HdOFL6", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"proJect-meta\"],[7],[0,\"\\n\\n  \"],[6,\"a\"],[10,\"href\",[20,[\"project\",\"effectiveUrl\"]],null],[7],[1,[20,[\"project\",\"effectiveName\"]],false],[8],[0,\"\\n\\n  \"],[1,[25,\"star-button\",null,[[\"label\",\"count\",\"disabled\",\"link\",\"act\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[[20,[\"starButtonLabel\"]],[20,[\"starCount\"]],[25,\"and\",[[20,[\"session\",\"isAuthenticated\"]],[20,[\"project\",\"projectInfo\",\"starPromisePending\"]]],null],[20,[\"project\",\"gitHubUrl\"]],[25,\"action\",[[19,0,[]],\"toggleStar\"],null],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"project\",\"emberObserver\"]]],null,{\"statements\":[[0,\"    \"],[6,\"a\"],[9,\"class\",\"-no-icon\"],[10,\"href\",[26,[\"https://emberobserver.com/addons/\",[20,[\"project\",\"id\"]]]]],[7],[0,\"\\n      \"],[6,\"img\"],[10,\"src\",[26,[\"https://emberobserver.com/badges/\",[20,[\"project\",\"id\"]],\".svg\"]]],[9,\"alt\",\"Ember Observer Score\"],[7],[8],[0,\"\\n    \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[25,\"gte\",[[20,[\"project\",\"status\"]],2],null]],null,{\"statements\":[[0,\"    \"],[6,\"span\"],[10,\"class\",[26,[\"proJect-status -status-\",[20,[\"project\",\"status\"]]]]],[10,\"title\",[18,\"statusTitle\"],null],[7],[0,\"\\n      \"],[1,[18,\"statusLabel\"],false],[0,\"\\n    \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"currentDescription\"]]],null,{\"statements\":[[0,\"  \"],[1,[25,\"markdown-to-html\",[[20,[\"currentDescription\"]]],[[\"class\"],[\"proJect-description\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/pro-ject/template.hbs" } });
});

define('lolma-us/pods/components/pro-jects/component', ['exports', 'lolma-us/helpers/random-string'], function (exports, _randomString) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    projects: undefined,
    gitHubProjectsStats: undefined,
    locale: 'en',
    loginAction: undefined,
    isAuthenticating: undefined,
    isAuthenticated: undefined,

    // ----- Services -----
    htmlState: Ember.inject.service(),

    // ----- Overridden properties -----
    classNames: ['proJects'],

    // ----- Static properties -----


    // ----- Computed properties -----
    checkboxId: Ember.computed(_randomString.randomString)

    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/pro-jects/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "giQNG4V4", "block": "{\"symbols\":[\"projects\",\"projects\",\"projects\",\"projects\"],\"statements\":[[6,\"h2\"],[9,\"class\",\"proJects-title -callout\"],[7],[0,\"\\n  \"],[1,[25,\"t\",[\"projects.title\"],null],false],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\\n\"],[1,[25,\"input\",null,[[\"type\",\"id\",\"class\",\"checked\"],[\"checkbox\",[20,[\"checkboxId\"]],\"proJects-stalledInput\",[20,[\"htmlState\",\"showStalledProjects\"]]]]],false],[0,\"\\n\\n\"],[6,\"label\"],[9,\"class\",\"proJects-stalledlabel\"],[10,\"for\",[18,\"checkboxId\"],null],[7],[0,\"\\n  \"],[1,[25,\"t\",[\"projects.showStalled\"],null],false],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\\n\"],[4,\"with\",[[25,\"filter-by\",[\"group\",\"sass\",[20,[\"projects\"]]],null]],null,{\"statements\":[[0,\"  \"],[6,\"h4\"],[9,\"class\",\"proJects-group-title h4\"],[7],[0,\"\\n    \"],[1,[25,\"t\",[\"projects.sassLibs\"],null],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[1,[25,\"project-group\",null,[[\"projects\",\"locale\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[[19,4,[]],[20,[\"locale\"]],[20,[\"gitHubProjectsStats\"]],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\"]],\"parameters\":[4]},null],[0,\"\\n\\n\\n\"],[4,\"with\",[[25,\"filter-by\",[\"group\",\"ember\",[20,[\"projects\"]]],null]],null,{\"statements\":[[0,\"  \"],[6,\"h4\"],[9,\"class\",\"proJects-group-title h4\"],[7],[0,\"\\n    \"],[1,[25,\"t\",[\"projects.emberAddons\"],null],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[1,[25,\"project-group\",null,[[\"projects\",\"locale\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[[25,\"filter-by\",[\"type\",\"addon\",[19,3,[]]],null],[20,[\"locale\"]],[20,[\"gitHubProjectsStats\"]],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\\n\\n  \"],[6,\"h4\"],[9,\"class\",\"proJects-group-title h4\"],[7],[0,\"\\n    \"],[1,[25,\"t\",[\"projects.emberApps\"],null],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[1,[25,\"project-group\",null,[[\"projects\",\"locale\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[[25,\"filter-by\",[\"type\",\"app\",[19,3,[]]],null],[20,[\"locale\"]],[20,[\"gitHubProjectsStats\"]],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n\\n\\n\"],[4,\"with\",[[25,\"filter-by\",[\"group\",\"js\",[20,[\"projects\"]]],null]],null,{\"statements\":[[0,\"  \"],[6,\"h4\"],[9,\"class\",\"proJects-group-title h4\"],[7],[0,\"\\n    \"],[1,[25,\"t\",[\"projects.jsLibs\"],null],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[1,[25,\"project-group\",null,[[\"projects\",\"locale\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[[19,2,[]],[20,[\"locale\"]],[20,[\"gitHubProjectsStats\"]],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"\\n\"],[4,\"with\",[[25,\"filter-by\",[\"group\",\"jquery\",[20,[\"projects\"]]],null]],null,{\"statements\":[[0,\"  \"],[6,\"h4\"],[9,\"class\",\"proJects-group-title h4\"],[7],[0,\"\\n    \"],[1,[25,\"t\",[\"projects.jQueryPlugins\"],null],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[1,[25,\"project-group\",null,[[\"projects\",\"locale\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[[19,1,[]],[20,[\"locale\"]],[20,[\"gitHubProjectsStats\"]],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/pro-jects/template.hbs" } });
});

define('lolma-us/pods/components/project-group/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    projects: undefined,
    gitHubProjectsStats: undefined,
    locale: 'en',
    loginAction: undefined,
    isAuthenticating: undefined,
    isAuthenticated: undefined,

    // ----- Services -----


    // ----- Overridden properties -----
    classNames: ['projectGroup']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/project-group/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "VsqXgszN", "block": "{\"symbols\":[\"project\"],\"statements\":[[4,\"each\",[[25,\"sort-by\",[\"status\",\"effectiveName\",[20,[\"projects\"]]],null]],null,{\"statements\":[[0,\"  \"],[1,[25,\"pro-ject\",null,[[\"class\",\"project\",\"locale\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[\"projectGroup-project\",[19,1,[]],[20,[\"locale\"]],[20,[\"gitHubProjectsStats\"]],[20,[\"loginAction\"]],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/project-group/template.hbs" } });
});

define('lolma-us/pods/components/sec-tion/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    innerClass: '',

    // ----- Services -----


    // ----- Overridden properties -----
    classNames: ['secTion']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/sec-tion/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jKQ26ZoW", "block": "{\"symbols\":[\"&default\"],\"statements\":[[6,\"div\"],[10,\"class\",[26,[\"secTion-inner \",[18,\"innerClass\"]]]],[7],[0,\"\\n  \"],[11,1],[0,\"\\n\"],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/sec-tion/template.hbs" } });
});

define('lolma-us/pods/components/side-menu/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----


    // ----- Services -----
    htmlState: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),

    // ----- Overridden properties -----
    classNames: ['sideMenu'],

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----
    _isElementAMenuItem: function _isElementAMenuItem(element) {
      return Ember.$(element).closest('.route-locale-menu-item').length > 0;
    },


    // ----- Events and observers -----
    collapseMenu: Ember.on('click', function (_ref) {
      var target = _ref.target;

      if (this._isElementAMenuItem(target)) this.set('htmlState.menuToggler', false);
    })

    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/side-menu/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "YuymiWT4", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"route-locale-menu-greeting\"],[7],[0,\"\\n  \"],[1,[25,\"t\",[\"menu.greeting\"],null],false],[0,\"\\n  \"],[6,\"span\"],[9,\"class\",\"route-locale-menu-greeting-emoji\"],[7],[0,\"😎\"],[8],[0,\"\\n\"],[8],[0,\"\\n\\n\"],[6,\"div\"],[9,\"class\",\"route-locale-menu-items\"],[7],[0,\"\\n\"],[4,\"if\",[[25,\"not\",[[25,\"starts-with\",[[20,[\"routing\",\"currentRouteName\"]],\"locale.blog.\"],null]],null]],null,{\"statements\":[[0,\"    \"],[4,\"link-to\",[\"locale.blog\"],[[\"class\"],[\"route-locale-menu-item _blog\"]],{\"statements\":[[1,[25,\"t\",[\"menu.blog\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[25,\"not-eq\",[[20,[\"routing\",\"currentRouteName\"]],\"locale.index\"],null]],null,{\"statements\":[[0,\"    \"],[4,\"link-to\",[\"locale.index\"],[[\"class\"],[\"route-locale-menu-item _resume\"]],{\"statements\":[[1,[25,\"t\",[\"menu.resume\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"a\"],[9,\"class\",\"route-locale-menu-item _source -no-icon\"],[9,\"href\",\"https://github.com/lolmaus/lolma.us\"],[7],[0,\"\\n    \"],[1,[25,\"t\",[\"menu.source\"],null],false],[0,\"\\n    \"],[6,\"span\"],[9,\"class\",\"externalLink\"],[7],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\"],[4,\"link-to\",null,[[\"class\",\"params\"],[\"route-locale-menu-item _locale\",[20,[\"routing\",\"router\",\"oppositeLocaleURLParams\"]]]],{\"statements\":[[0,\"    \"],[1,[25,\"t\",[\"langSwitcher\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/side-menu/template.hbs" } });
});

define('lolma-us/pods/components/star-button/component', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----
    label: undefined,
    link: undefined,
    act: undefined,
    count: undefined,
    loginAction: undefined,
    isAuthenticating: undefined,
    isAuthenticated: undefined,

    // ----- Services -----


    // ----- Overridden properties -----
    classNames: ['starButton']

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/star-button/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jr9g6B/3", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"starButton-buttonWrapper\"],[7],[0,\"\\n\\n  \"],[6,\"a\"],[10,\"class\",[26,[\"starButton-button \",[25,\"if\",[[20,[\"disabled\"]],\"-disabled\",\"\"],null],\" -no-icon\"]]],[10,\"href\",[18,\"link\"],null],[3,\"action\",[[19,0,[]],[20,[\"act\"]]]],[7],[0,\"\\n    ★ \"],[1,[18,\"label\"],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[6,\"div\"],[9,\"class\",\"starButton-loginAction\"],[7],[0,\"\\n    \"],[6,\"div\"],[9,\"class\",\"starButton-loginAction-inner\"],[7],[0,\"\\n      \"],[6,\"div\"],[9,\"class\",\"starButton-loginAction-text\"],[7],[0,\"\\n        \"],[1,[25,\"t\",[[25,\"if\",[[20,[\"isAuthenticated\"]],\"login.goodbye\",\"login.welcome\"],null]],null],false],[0,\"\\n      \"],[8],[0,\"\\n\\n      \"],[6,\"button\"],[9,\"class\",\"starButton-loginAction-button starButton-button\"],[10,\"disabled\",[18,\"isAuthenticating\"],null],[3,\"action\",[[19,0,[]],[20,[\"loginAction\"]]]],[7],[0,\"\\n        \"],[1,[25,\"t\",[[25,\"if\",[[20,[\"isAuthenticated\"]],\"login.logOut\",[25,\"if\",[[20,[\"isAuthenticating\"]],\"login.loggingIn\",\"login.logIn\"],null]],null]],null],false],[0,\"\\n      \"],[8],[0,\"\\n\\n      \"],[6,\"span\"],[7],[0,\"\\n        \"],[1,[25,\"unless\",[[20,[\"isAuthenticated\"]],[25,\"t\",[\"login.withGitHub\"],null]],null],false],[0,\"\\n      \"],[8],[0,\"\\n    \"],[8],[0,\"\\n  \"],[8],[0,\"\\n\\n\"],[8],[0,\"\\n\\n\\n\\n\"],[4,\"unless\",[[25,\"is-nully\",[[20,[\"count\"]]],null]],null,{\"statements\":[[0,\"  \"],[6,\"span\"],[9,\"class\",\"starButton-count\"],[7],[0,\"\\n    \"],[1,[18,\"count\"],false],[0,\"\\n  \"],[8],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/star-button/template.hbs" } });
});

define('lolma-us/pods/components/time-line/component', ['exports', 'lolma-us/helpers/random-string'], function (exports, _randomString) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({

    // ----- Arguments -----


    // ----- Services -----
    htmlState: Ember.inject.service(),

    // ----- Overridden properties -----
    classNames: ['timeLine'],

    // ----- Static properties -----


    // ----- Computed properties -----
    checkboxId: Ember.computed(_randomString.randomString)

    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/components/time-line/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "mQ33+Mxz", "block": "{\"symbols\":[\"item\"],\"statements\":[[6,\"h2\"],[9,\"class\",\"timeLine-title -callout\"],[7],[0,\"\\n  \"],[1,[25,\"t\",[\"timeline.title\"],null],false],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\\n\"],[1,[25,\"input\",null,[[\"type\",\"id\",\"class\",\"checked\"],[\"checkbox\",[20,[\"checkboxId\"]],\"timeLine-showDetails\",[20,[\"htmlState\",\"timelineShowDetails\"]]]]],false],[0,\"\\n\\n\"],[6,\"label\"],[10,\"for\",[18,\"checkboxId\"],null],[7],[0,\"\\n  \"],[1,[25,\"t\",[\"timeline.details\"],null],false],[0,\"\\n\"],[8],[0,\"\\n\\n\\n\\n\"],[6,\"div\"],[9,\"class\",\"timeLine-list\"],[7],[0,\"\\n\"],[0,\"\\n\"],[4,\"each\",[[25,\"sort-by\",[\"start:desc\",[20,[\"experiences\"]]],null]],null,{\"statements\":[[0,\"\\n    \"],[6,\"div\"],[9,\"class\",\"timeLine-item\"],[7],[0,\"\\n      \"],[6,\"div\"],[9,\"class\",\"timeLine-item-icon\"],[7],[0,\"\\n\"],[4,\"if\",[[19,1,[\"type\"]]],null,{\"statements\":[[0,\"          \"],[1,[25,\"svg-jar\",[[25,\"if\",[[25,\"eq\",[[19,1,[\"type\"]],\"project\"],null],\"folder\",[25,\"if\",[[25,\"eq\",[[19,1,[\"type\"]],\"education\"],null],\"hat\",\"office\"],null]],null]],[[\"class\"],[[25,\"concat\",[\"timeLine-item-icon-icon _\",[19,1,[\"type\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[8],[0,\"\\n\\n      \"],[6,\"div\"],[9,\"class\",\"timeLine-item-info\"],[7],[0,\"\\n        \"],[6,\"div\"],[9,\"class\",\"timeLine-item-date\"],[7],[0,\"\\n\"],[4,\"if\",[[19,1,[\"start\"]]],null,{\"statements\":[[0,\"            \"],[1,[25,\"moment-format\",[[19,1,[\"start\"]],\"MMM YYYY\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[19,1,[\"end\"]]],null,{\"statements\":[[0,\"            — \"],[1,[25,\"moment-format\",[[19,1,[\"end\"]],\"MMM YYYY\"],null],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[19,1,[\"present\"]]],null,{\"statements\":[[0,\"            — \"],[1,[25,\"t\",[\"timeline.present\"],null],false],[0,\"\\n          \"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"        \"],[8],[0,\"\\n\\n        \"],[1,[25,\"markdown-to-html\",[[19,1,[\"title\"]]],[[\"class\"],[\"timeLine-item-name\"]]],false],[0,\"\\n\\n\"],[4,\"if\",[[19,1,[\"body\"]]],null,{\"statements\":[[0,\"          \"],[1,[25,\"markdown-to-html\",[[19,1,[\"body\"]]],[[\"class\"],[\"timeLine-item-desc\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[8],[0,\"\\n    \"],[8],[0,\"\\n\\n\"]],\"parameters\":[1]},null],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/components/time-line/template.hbs" } });
});

define('lolma-us/pods/index/route', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({

    // ----- Services -----
    fastboot: Ember.inject.service(),
    headData: Ember.inject.service(),

    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    redirect: function redirect() {
      if (!this.get('fastboot.isFastBoot')) this.transitionTo('locale.blog', 'en');else this.set('headData.redirectToEn', true);
    }
  }
  // model() {
  //   /* jshint unused:false */
  //   const model = this.modelFor('')
  //
  //   return RSVP.hash({
  //     /* jshint ignore:start */
  //     ...model,
  //     /* jshint ignore:end */
  //   })
  // },


  // ----- Custom Methods -----


  // ----- Events and observers -----


  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define('lolma-us/pods/locale/blog/index/route', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

  exports.default = Ember.Route.extend({

    // ----- Services -----
    config: Ember.inject.service(),
    // i18n   : service(),


    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    model: function model() {
      var model = this.modelFor('locale.blog');
      var locale = model.locale;
      var store = this.get('store');

      return Ember.RSVP.hash(_extends({}, model, {
        posts: store.query('post', { locale: locale }),
        ogType: 'blog'
      }));
    }
  }

  // ----- Custom Methods -----


  // ----- Events and observers -----


  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define("lolma-us/pods/locale/blog/index/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lv1DFSXL", "block": "{\"symbols\":[\"post\"],\"statements\":[[6,\"div\"],[9,\"class\",\"route-blogIndex\"],[7],[0,\"\\n\\n  \"],[6,\"div\"],[9,\"class\",\"route-blogIndex-posts\"],[7],[0,\"\\n\"],[4,\"each\",[[25,\"sort-by\",[\"created:desc\",[20,[\"model\",\"posts\"]]],null]],null,{\"statements\":[[0,\"      \"],[1,[25,\"blog-post\",null,[[\"class\",\"post\",\"summary\"],[\"route-blogIndex-post\",[19,1,[]],true]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[8],[0,\"\\n\\n\"],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/locale/blog/index/template.hbs" } });
});

define('lolma-us/pods/locale/blog/post/controller', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({

    // ----- Services -----
    fastboot: Ember.inject.service()

    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define('lolma-us/pods/locale/blog/post/route', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

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

  exports.default = Ember.Route.extend({

    // ----- Services -----


    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    model: function model(_ref) {
      var slug = _ref.slug;

      var model = this.modelFor('locale.blog');
      var locale = model.locale;
      var store = this.get('store');

      return Ember.RSVP.hash(_extends({}, model, {
        post: store.queryRecord('post', { locale: locale, slug: slug })
      })).then(function (model) {
        return Ember.RSVP.hash(_extends({}, model, {

          ogType: 'article',

          linkedData: _extends({}, model.linkedData, {

            article: {
              '@type': model.post.get('proficiency') ? 'TechArticle' : 'Article',

              author: model.linkedData.website.author,
              accessMode: model.linkedData.website.accessMode,
              inLanguage: model.linkedData.website.inLanguage,
              audience: model.linkedData.website.audience,
              license: model.linkedData.website.license,

              headline: model.post.get('title'),
              description: model.post.get('summary'),
              image: model.post.get('image') || 'https://lolma.us/favicon.jpg',
              datePublished: model.post.get('created') && model.post.get('created').toISOString(),
              dateModified: model.post.get('updated') && model.post.get('updated').toISOString(),
              dependencies: model.post.get('dependencies'),
              proficiency: model.post.get('proficiency'),
              keywords: model.post.get('keywords'),

              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': model.post.get('url')
              }
            },

            breadcrumb: _extends({}, model.linkedData.breadcrumb, {

              itemListElement: [].concat(_toConsumableArray(model.linkedData.breadcrumb.itemListElement), [{
                '@type': 'ListItem',
                position: model.linkedData.breadcrumb.itemListElement.length + 1,

                item: {
                  '@id': model.post.get('url'),
                  name: model.post.get('title')
                }
              }])
            })
          })
        }));
      });
    },
    titleToken: function titleToken(model) {
      return model.post.get('title');
    }
  }

  // ----- Custom Methods -----


  // ----- Events and observers -----


  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define("lolma-us/pods/locale/blog/post/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cSfcVJAH", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"route-blogPost\"],[7],[0,\"\\n\\n  \"],[4,\"link-to\",[\"locale.blog\"],[[\"class\"],[\"route-blogPost-back\"]],{\"statements\":[[1,[25,\"t\",[\"blogPost.back\"],null],false]],\"parameters\":[]},null],[0,\"\\n\\n  \"],[1,[25,\"blog-post\",null,[[\"class\",\"post\"],[\"route-blogPost-post\",[20,[\"model\",\"post\"]]]]],false],[0,\"\\n\\n\"],[4,\"unless\",[[20,[\"fastboot\",\"isFastBoot\"]]],null,{\"statements\":[[0,\"    \"],[1,[25,\"disqus-comments\",null,[[\"class\",\"identifier\",\"title\"],[\"route-blogPost-comments\",[20,[\"model\",\"post\",\"disqusId\"]],[20,[\"model\",\"post\",\"title\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[8],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/locale/blog/post/template.hbs" } });
});

define('lolma-us/pods/locale/blog/route', ['exports', 'lolma-us/macros/t'], function (exports, _t) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

  exports.default = Ember.Route.extend({

    // ----- Services -----
    i18n: Ember.inject.service(),

    // ----- Overridden properties -----
    titleToken: (0, _t.default)('blog.title'),

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    model: function model() {
      var model = this.modelFor('locale');
      var locale = model.locale;
      var i18n = this.get('i18n');

      return Ember.RSVP.hash(_extends({}, model, {

        linkedData: _extends({}, model.linkedData, {

          blog: {
            '@type': 'Blog',

            author: model.linkedData.website.author,
            accessMode: model.linkedData.website.accessMode,
            inLanguage: model.linkedData.website.inLanguage,
            audience: model.linkedData.website.audience,
            license: model.linkedData.website.license,

            name: i18n.t('blogIndex.name').string,
            description: i18n.t('blogIndex.description').string,
            url: 'https://lolma.us/' + locale + '/blog/',

            keywords: ['development', 'web development', 'webdev', 'ember', 'emberjs', 'js', 'javascript', 'frontend']
          },

          breadcrumb: {
            '@type': 'BreadcrumbList',

            itemListElement: [{
              '@type': 'ListItem',
              position: 1,

              item: {
                '@id': 'https://lolma.us/' + locale + '/blog/',
                name: i18n.t('menu.blog').string
              }
            }]
          }

        })
      }));
    }
  }

  // ----- Custom Methods -----


  // ----- Events and observers -----


  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define("lolma-us/pods/locale/blog/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ls+Wh6y4", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"route-blog\"],[7],[0,\"\\n\\n\\n\"],[4,\"sec-tion\",null,null,{\"statements\":[[0,\"    \"],[6,\"div\"],[9,\"class\",\"route-blog-sidebar\"],[7],[0,\"\\n      \"],[6,\"div\"],[9,\"class\",\"route-blog-sidebar-section _avatar\"],[7],[0,\"\\n        \"],[6,\"img\"],[9,\"class\",\"route-blog-sidebar-avatar\"],[9,\"src\",\"/favicon.jpg\"],[10,\"alt\",[25,\"t\",[\"header.title\"],null],null],[9,\"width\",\"512\"],[9,\"height\",\"512\"],[7],[8],[0,\"\\n      \"],[8],[0,\"\\n\\n      \"],[6,\"div\"],[9,\"class\",\"route-blog-sidebar-section _content\"],[7],[0,\"\\n        \"],[6,\"h2\"],[9,\"class\",\"route-blog-title\"],[7],[0,\"\\n          \"],[1,[25,\"t\",[\"header.title\"],null],false],[0,\"\\n          @lolmaus\\n        \"],[8],[0,\"\\n\\n        \"],[6,\"div\"],[9,\"class\",\"route-blog-subtitle\"],[7],[0,\"\\n          \"],[1,[25,\"t\",[\"header.subtitle\"],null],false],[0,\"\\n        \"],[8],[0,\"\\n\\n        \"],[1,[25,\"horizontal-menu\",null,[[\"class\"],[\"route-blogIndex-menu\"]]],false],[0,\"\\n      \"],[8],[0,\"\\n      \\n      \"],[6,\"div\"],[9,\"class\",\"route-blog-sidebar-section _bottom\"],[7],[0,\"\\n\\n        \"],[6,\"a\"],[9,\"class\",\"route-blog-sidebar-section-bottom-link -no-icon\"],[9,\"href\",\"https://creativecommons.org/licenses/by/4.0/\"],[7],[0,\"\\n          \"],[1,[25,\"svg-jar\",[\"cc-by\"],[[\"class\",\"alt\",\"title\"],[\"route-blog-sidebar-section-bottom-icon _cc\",[25,\"concat\",[[25,\"t\",[\"blog.license\"],null],\" Creative Commons 4.0 Attribution\"],null],[25,\"concat\",[[25,\"t\",[\"blog.license\"],null],\" Creative Commons 4.0 Attribution\"],null]]]],false],[0,\"\\n        \"],[8],[0,\"\\n\\n        \"],[6,\"a\"],[9,\"class\",\"route-blog-sidebar-section-bottom-link -no-icon\"],[10,\"href\",[26,[\"https://lolma.us/rss_\",[20,[\"model\",\"locale\"]],\".xml\"]]],[7],[0,\"\\n          \"],[1,[25,\"svg-jar\",[\"rss\"],[[\"class\",\"alt\",\"title\"],[\"route-blog-sidebar-section-bottom-icon _rss\",\"RSS\",\"RSS\"]]],false],[0,\"\\n        \"],[8],[0,\"\\n      \"],[8],[0,\"\\n      \\n    \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\\n\"],[4,\"sec-tion\",null,[[\"class\",\"innerClass\"],[\"route-blog-content\",\"route-blog-content-inner\"]],{\"statements\":[[0,\"    \"],[1,[18,\"outlet\"],false],[0,\"\\n  \"]],\"parameters\":[]},null],[0,\"\\n\\n\\n\"],[8],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/locale/blog/template.hbs" } });
});

define('lolma-us/pods/locale/controller', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({

    // ----- Services -----
    htmlState: Ember.inject.service(),

    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----
    init: function init() {
      this._super.apply(this, arguments);

      if (typeof FastBoot === 'undefined') {
        Ember.$('html').addClass('-live');
      }
    }
  }

  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define('lolma-us/pods/locale/index/controller', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var ANAL_CONSENT_LS_KEY = 'lolma.us analytics consent';

  exports.default = Ember.Controller.extend({

    // ----- Services -----
    i18n: Ember.inject.service(),
    session: Ember.inject.service(),

    // ----- Overridden properties -----


    // ----- Static properties -----
    isAuthenticating: false,

    // ----- Computed properties -----


    // ----- Overridden Methods -----


    // ----- Custom Methods -----
    _getAnalConsent: function _getAnalConsent() {
      var maybeConsentStr = localStorage.getItem(ANAL_CONSENT_LS_KEY);

      if (maybeConsentStr) return JSON.parse(maybeConsentStr);

      var message = this.get('i18n').t('localeIndex.loginWarning').string;
      var consentBool = window.confirm(message);

      localStorage.setItem(ANAL_CONSENT_LS_KEY, JSON.stringify(consentBool));
      return consentBool;
    },


    // ----- Events and observers -----


    // ----- Tasks -----


    // ----- Actions -----
    actions: {
      login: function login() {
        var _this = this;

        var analConsent = this._getAnalConsent();

        this.set('isAuthenticating', true);

        this.get('session').authenticate('authenticator:torii', 'github-oauth2', { analConsent: analConsent }).finally(function () {
          return _this.set('isAuthenticating', false);
        });
      },
      logout: function logout() {
        this.get('session').invalidate();
      }
    }
  });
});

define('lolma-us/pods/locale/index/route', ['exports', 'npm:lodash', 'lolma-us/macros/t'], function (exports, _npmLodash, _t) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

  exports.default = Ember.Route.extend({

    // ----- Services -----
    config: Ember.inject.service(),
    i18n: Ember.inject.service(),
    session: Ember.inject.service(),

    // ----- Overridden properties -----
    titleToken: (0, _t.default)('localeIndex.title'),

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    model: function model() {
      var _this = this;

      var model = this.modelFor('locale');
      var locale = model.locale;
      var store = this.get('store');

      this.get('session.isAuthenticated'); // consume the property for the observer to work

      return Ember.RSVP.hash(_extends({}, model, {

        projects: store.findAll('project'),
        markdownBlocks: store.query('markdown-block', { locale: locale }),
        experiences: store.query('experience', { locale: locale }),

        projectInfos: store.findAll('project-info').catch(function (response) {
          return response.status === 403 ? null : Ember.RSVP.reject(response);
        }), // Ignore 403 error

        stackoverflowUser: store.findRecord('stackoverflowUser', '901944').catch(function () {
          return store.peekRecord('stackoverflowUser', '901944');
        }),

        linkedData: _extends({}, model.linkedData, {

          profile: _extends({}, model.linkedData.website, {
            '@type': 'ProfilePage',
            name: 'Andrey Mikhaylov (lolmaus)'
          })
        }),

        ogType: 'profile'
      })).then(function (model) {
        return Ember.RSVP.hash(_extends({}, model, {
          remainingProjectInfos: _this.fetchRemainingProjectInfos(model.projects)
        }));
      });
    },


    // ----- Custom Methods -----
    fetchRemainingProjectInfos: function fetchRemainingProjectInfos(projects) {
      var store = this.get('store');
      var existingIds = store.peekAll('project-info').mapBy('id');

      if (!existingIds.length) return Ember.RSVP.resolve();

      var idsFormProjects = projects.mapBy('gitHubId');
      var remainingIds = _npmLodash.default.reject(idsFormProjects, function (id) {
        return existingIds.includes(id);
      });

      var promises = remainingIds.map(function (id) {
        return store.findRecord('project-info', id).catch(function (response) {
          if (response.status === 403) return null;
          return Ember.RSVP.reject(response);
        });
      });

      return Ember.RSVP.all(promises);
    },


    // ----- Events and observers -----
    reloadOnAuth: Ember.observer('session.isAuthenticated', function () {
      if (this.get('session.isAuthenticated')) this.refresh();
    })

    // ----- Tasks -----


    // ----- Actions -----
    // actions: {
    // }
  });
});

define("lolma-us/pods/locale/index/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2Gt6f3/2", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"route-localeIndex\"],[7],[0,\"\\n  \"],[1,[25,\"hero-header\",null,[[\"scrollToTarget\"],[\"#menu\"]]],false],[0,\"\\n\\n\"],[4,\"sec-tion\",null,[[\"id\",\"class\",\"innerClass\"],[\"menu\",\"route-localeIndex-menu\",\"route-localeIndex-menu-inner\"]],{\"statements\":[[0,\"    \"],[1,[25,\"horizontal-menu\",null,[[\"class\"],[\"route-localeIndex-horizontalMenu\"]]],false],[0,\"\\n  \"]],\"parameters\":[]},null],[0,\"\\n\\n\\n\"],[4,\"sec-tion\",null,[[\"id\",\"class\",\"innerClass\"],[\"content\",\"route-localeIndex-cards\",\"route-localeIndex-cards-inner\"]],{\"statements\":[[0,\"\\n    \"],[1,[25,\"markdown-block\",null,[[\"class\",\"section\"],[\"route-localeIndex-card _personality\",[25,\"find-by\",[\"id\",[25,\"concat\",[\"personality-\",[20,[\"model\",\"locale\"]]],null],[20,[\"model\",\"markdownBlocks\"]]],null]]]],false],[0,\"\\n\\n    \"],[1,[25,\"online-presence\",null,[[\"class\",\"projectInfos\",\"stackoverflowUser\"],[\"route-localeIndex-card _presence\",[20,[\"model\",\"projectInfos\"]],[20,[\"model\",\"stackoverflowUser\"]]]]],false],[0,\"\\n\\n    \"],[1,[25,\"markdown-block\",null,[[\"class\",\"section\"],[\"route-localeIndex-card _skills\",[25,\"find-by\",[\"id\",[25,\"concat\",[\"skills-\",[20,[\"model\",\"locale\"]]],null],[20,[\"model\",\"markdownBlocks\"]]],null]]]],false],[0,\"\\n\\n    \"],[1,[25,\"pro-jects\",null,[[\"class\",\"projects\",\"locale\",\"isFastBoot\",\"gitHubProjectsStats\",\"loginAction\",\"isAuthenticating\",\"isAuthenticated\"],[\"route-localeIndex-card _projects\",[20,[\"model\",\"projects\"]],[20,[\"model\",\"locale\"]],[20,[\"model\",\"isFastBoot\"]],[20,[\"model\",\"gitHubProjectsStats\"]],[25,\"action\",[[19,0,[]],[25,\"if\",[[20,[\"session\",\"isAuthenticated\"]],\"logout\",\"login\"],null]],null],[20,[\"isAuthenticating\"]],[20,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n\\n    \"],[1,[25,\"time-line\",null,[[\"class\",\"experiences\"],[\"route-localeIndex-card _timeline\",[20,[\"model\",\"experiences\"]]]]],false],[0,\"\\n\\n    \"],[1,[25,\"markdown-block\",null,[[\"class\",\"section\"],[\"route-localeIndex-card _about-site\",[25,\"find-by\",[\"id\",[25,\"concat\",[\"about-site-\",[20,[\"model\",\"locale\"]]],null],[20,[\"model\",\"markdownBlocks\"]]],null]]]],false],[0,\"\\n  \"]],\"parameters\":[]},null],[0,\"\\n\\n\\n\\n\\n\"],[4,\"unless\",[[20,[\"model\",\"isFastBoot\"]]],null,{\"statements\":[[4,\"sec-tion\",null,[[\"class\",\"innerClass\"],[\"route-localeIndex-footer\",\"route-localeIndex-footer-inner\"]],{\"statements\":[[0,\"      \"],[6,\"hr\"],[7],[8],[0,\"\\n\\n      \"],[6,\"div\"],[7],[0,\"\\n\"],[4,\"if\",[[20,[\"isAuthenticating\"]]],null,{\"statements\":[[0,\"          \"],[1,[25,\"t\",[\"login.loggingIn\"],null],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[20,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"          \"],[6,\"a\"],[9,\"href\",\"\"],[3,\"action\",[[19,0,[]],\"logout\"]],[7],[1,[25,\"t\",[\"login.logOut\"],null],false],[8],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[6,\"a\"],[9,\"href\",\"\"],[3,\"action\",[[19,0,[]],\"login\"]],[7],[1,[25,\"t\",[\"login.logIn\"],null],false],[8],[0,\" \"],[1,[25,\"t\",[\"login.withGitHub\"],null],false],[0,\"\\n        \"]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"      \"],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"]],\"parameters\":[]},null],[0,\"\\n\"],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/locale/index/template.hbs" } });
});

define('lolma-us/pods/locale/route', ['exports', 'lolma-us/macros/t'], function (exports, _t) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var linkedData = function linkedData(locale) {
    return {
      website: {
        '@type': 'WebSite',

        image: 'https://lolma.us/favicon.jpg',

        author: {
          '@type': 'Person',
          name: 'Andrey Mikhaylov',
          givenName: 'Andrey',
          familyName: 'Mikhaylov',
          additionalName: 'lolmaus',
          email: 'mailto:lolmaus@gmail.com',
          image: 'https://lolma.us/favicon.jpg',

          address: {
            '@type': 'PostalAddress',
            addressCountry: 'Russia',
            addressLocality: 'Moscow',

            availableLanguage: {
              '@type': 'Language',
              name: ['Russian']
            }
          },

          brand: {
            '@type': 'Brand',
            name: 'Helix TeamHub',
            logo: 'https://lolma.us/images/linked-data/helix-teamhub-logo.png',
            url: 'https://www.perforce.com/products/helix-teamhub',
            description: 'Code Hosting and Collaboration for Git+'
          },

          homeLocation: {
            '@type': 'Place',

            address: {
              '@type': 'PostalAddress',
              addressCountry: 'Russia',
              addressLocality: 'Moscow',

              availableLanguage: {
                '@type': 'Language',
                name: ['Russian']
              }
            }
          },

          jobTitle: ['Frontend developer', 'EmberJS developer'],

          memberOf: {
            '@type': 'Organization',
            logo: 'https://lolma.us/images/linked-data/perforce-logo.png',
            url: 'https://www.perforce.com/',
            name: 'Perforce',

            brand: [{
              '@type': 'Brand',
              name: 'Helix Core',
              logo: 'https://lolma.us/images/linked-data/helix-core-logo.png',
              url: 'https://www.perforce.com/products/helix-core',
              description: 'Version Control + Swarm Code Review & Collaboration'
            }, {
              '@type': 'Brand',
              name: 'Hansoft',
              logo: 'https://lolma.us/images/linked-data/hansoft-logo.png',
              url: 'https://hansoft.com/',
              description: 'Agile Project & Product Management Solution'
            }, {
              '@type': 'Brand',
              name: 'Helix TeamHub',
              logo: 'https://lolma.us/images/linked-data/helix-teamhub-logo.png',
              url: 'https://www.perforce.com/products/helix-teamhub',
              description: 'Code Hosting and Collaboration for Git+'
            }, {
              '@type': 'Brand',
              name: 'Helix ALM',
              logo: 'https://lolma.us/images/linked-data/helix-alm-logo.png',
              url: 'https://www.perforce.com/products/helix-alm',
              description: 'Flexible, End-to-End Application Lifecycle Management'
            }]
          },

          nationality: {
            '@type': 'Country',
            name: 'Russia',
            alternateName: 'Russian Federation'
          }
        },

        accessMode: 'textual',
        inLanguage: locale,

        audience: {
          '@type': 'Audience',

          audienceType: ['developers', 'web developers', 'javascript developers', 'js developers', 'ember developers', 'emberjs developers']
        },

        license: {
          '@type': 'CreativeWork',
          name: 'Creative Commons Attribution 4.0 International',
          alternateName: 'CC BY 4.0',
          url: 'https://creativecommons.org/licenses/by/4.0/',
          description: 'You are free to: Share — copy and redistribute the material in any medium or format; Adapt — remix, transform, and build upon the material for any purpose, even commercially). This license is acceptable for Free Cultural Works. The licensor cannot revoke these freedoms as long as you follow the license terms. Under the following terms: Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use. No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.'
        }
      }
    };
  };
  // import _ from 'npm:lodash'
  // import {computed} from '@ember/object'
  exports.default = Ember.Route.extend({

    // ----- Services -----
    config: Ember.inject.service(),
    i18n: Ember.inject.service(),
    moment: Ember.inject.service(),
    fastboot: Ember.inject.service(),

    // ----- Overridden properties -----
    titleToken: (0, _t.default)('locale.title'),

    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----
    model: function model(_ref) {
      var locale = _ref.locale;

      if (!['en', 'ru'].includes(locale)) locale = 'en';
      this.set('i18n.locale', locale);
      this.get('moment').changeLocale(locale);

      // const model = this.modelFor('application')
      var store = this.get('store');
      var isFastBoot = this.get('fastboot.isFastBoot');

      return Ember.RSVP.hash({
        // ...model,
        isFastBoot: isFastBoot,
        locale: locale,
        cacheBuster: store.findRecord('cache-buster', 'buster'),
        linkedData: linkedData(locale),
        ogType: 'website'
      });
    },
    afterModel: function afterModel() {
      this._checkCacheBuster();
    },


    // ----- Custom Methods -----
    _checkCacheBuster: function _checkCacheBuster() {
      var _this = this;

      if (this.get('fastboot.isFastBoot')) return;

      var store = this.get('store');
      var buster = store.peekRecord('cache-buster', 'buster');

      if (!buster) return;

      var oldString = buster.get('string');

      store.findRecord('cache-buster', 'buster', { reload: true }).then(function (buster) {
        if (oldString !== buster.get('string')) _this._offerPageReload();
      });
    },
    _offerPageReload: function _offerPageReload() {
      var i18n = this.get('i18n');
      var message = i18n.t('refreshSuggestion');

      if (window.confirm(message)) window.location.reload(true);
    },
    _reloadPage: function _reloadPage() {
      // http://stackoverflow.com/a/27058362/901944
      Ember.$.ajax({
        url: window.location.href,
        headers: {
          Pragma: 'no-cache',
          Expires: -1,
          'Cache-Control': 'no-cache'
        }
      }).done(function () {
        return window.location.reload(true);
      });
    }
  }

  // ----- Events and observers -----


  // ----- Tasks -----


  // ----- Actions -----
  // actions: {
  // }
  );
});

define("lolma-us/pods/locale/template", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XJMFPwUI", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[9,\"class\",\"route-locale\"],[7],[0,\"\\n\\n  \"],[1,[25,\"input\",null,[[\"class\",\"id\",\"type\",\"checked\"],[\"route-locale-menuToggler\",\"route-locale-menuToggler\",\"checkbox\",[20,[\"htmlState\",\"menuToggler\"]]]]],false],[0,\"\\n\\n  \"],[6,\"label\"],[9,\"class\",\"route-locale-burger\"],[9,\"for\",\"route-locale-menuToggler\"],[7],[0,\"\\n    \"],[1,[25,\"svg-jar\",[\"hamburger\"],[[\"class\"],[\"route-locale-burger-icon\"]]],false],[0,\"\\n  \"],[8],[0,\"\\n\\n  \"],[6,\"label\"],[9,\"class\",\"route-locale-backdrop\"],[9,\"for\",\"route-locale-menuToggler\"],[7],[8],[0,\"\\n\\n\\n\\n  \"],[1,[25,\"side-menu\",null,[[\"class\"],[\"route-locale-menu\"]]],false],[0,\"\\n\\n\\n\\n  \"],[6,\"div\"],[9,\"class\",\"route-locale-content\"],[7],[0,\"\\n    \"],[1,[18,\"outlet\"],false],[0,\"\\n  \"],[8],[0,\"\\n\\n\"],[8]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/pods/locale/template.hbs" } });
});

define('lolma-us/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});

define('lolma-us/router', ['exports', 'lolma-us/config/environment', 'ember-cli-nprogress'], function (exports, _environment, _emberCliNprogress) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  var Router = Ember.Router.extend({
    // ----- Services -----
    fastboot: Ember.inject.service(),
    headData: Ember.inject.service(),
    htmlState: Ember.inject.service(),
    i18n: Ember.inject.service(),
    metrics: Ember.inject.service(),

    // ----- Overridden properties -----
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL,

    // ----- Custom properties -----
    initialLoadingComplete: false,

    // ----- Computed properties -----
    oppositeLocaleURLParams: Ember.computed(function () {
      var oppositeLocale = this.get('i18n.oppositeLocale');
      var currentRouteName = this.get('currentRouteName');
      var currentHandlerInfos = this.get('_routerMicrolib.currentHandlerInfos');

      var segments = currentHandlerInfos.slice(2).map(function (info) {
        return info._names.map(function (name) {
          return info.params[name];
        });
      }).reduce(function (result, item) {
        return result.concat(item);
      }, []); //flatten

      return [currentRouteName, oppositeLocale].concat(_toConsumableArray(segments));
    }).volatile(),

    setTitle: function setTitle(title) {
      this.get('headData').setProperties({ title: title });
    },
    willTransition: function willTransition() {
      this._super.apply(this, arguments);
      this.propertyWillChange('oppositeLocaleURLParams');
      if (this.get('initialLoadingComplete') && !this.get('fastboot.isFastBoot')) _emberCliNprogress.default.start();
    },
    didTransition: function didTransition() {
      this._super.apply(this, arguments);
      this._trackPage();
      this.get('htmlState').restoreHtmlState();
      this.propertyDidChange('oppositeLocaleURLParams');
      _emberCliNprogress.default.done();
      if (this.get('initialLoadingComplete') && !this.get('fastboot.isFastBoot')) _emberCliNprogress.default.done();else this.set('initialLoadingComplete', true);
    },
    _trackPage: function _trackPage() {
      var _this = this;

      if (typeof FastBoot === 'undefined') {
        Ember.run.scheduleOnce('afterRender', this, function () {
          _this.get('metrics').trackPage({
            page: _this.get('url'),
            title: _this.get('currentRouteName') || 'unknown'
          });
        });
      }
    }
  });

  Router.map(function () {
    this.route('locale', { path: ':locale' }, function () {
      this.route('blog', function () {
        this.route('post', { path: ':slug' });
      });
    });
  });

  exports.default = Router;
});

define('lolma-us/routes/application', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Route = Ember.Route;
  exports.default = Route.extend();
});

define('lolma-us/serializers/_json', ['exports', 'ember-data/serializers/json', 'ember-inflector'], function (exports, _json, _emberInflector) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  exports.default = _json.default.extend({
    // serialize (snapshot, options) {
    //   return {
    //     [snapshot.modelName]: this._super(snapshot, options)
    //   }
    // }


    pushPayload: function pushPayload(store, payload) {
      var modelName = Object.keys(payload)[0];
      var payloadFragment = payload[modelName];
      // const modelName       = this.modelNameFromPayloadKey(key)
      var type = store.modelFor(modelName);
      var typeSerializer = store.serializerFor(type.modelName);
      var documentHash = { included: [] };

      if (Ember.isArray(payloadFragment)) {
        documentHash.data = [];

        payloadFragment.forEach(function (payloadItem) {
          var _documentHash$include;

          var _typeSerializer$norma = typeSerializer.normalize(type, payloadItem, modelName),
              data = _typeSerializer$norma.data,
              included = _typeSerializer$norma.included;

          documentHash.data.push(data);
          if (included) (_documentHash$include = documentHash.included).push.apply(_documentHash$include, _toConsumableArray(included));
        });
      } else {
        var _documentHash$include2;

        var _typeSerializer$norma2 = typeSerializer.normalize(type, payloadFragment, modelName),
            data = _typeSerializer$norma2.data,
            included = _typeSerializer$norma2.included;

        documentHash.data = data;
        if (included) (_documentHash$include2 = documentHash.included).push.apply(_documentHash$include2, _toConsumableArray(included));
      }

      return store.push(documentHash);
    },
    modelNameFromPayloadKey: function modelNameFromPayloadKey(key) {
      return (0, _emberInflector.singularize)(Ember.String.dasherize(key));
    }
  });
});

define('lolma-us/serializers/application', ['exports', 'ember-data/serializers/json-api'], function (exports, _jsonApi) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _jsonApi.default.extend({
    pushPayload: function pushPayload(store, payload) {
      var _this = this;

      var modelName = Object.keys(payload)[0];
      var payloadFragmentArray = payload[modelName];
      var normalizedPayloadArray = payloadFragmentArray.map(function (payloadFragment) {
        return _this._normalizeDocumentHelper(payloadFragment);
      });

      return normalizedPayloadArray.map(function (normalizedPayload) {
        return store.push(normalizedPayload);
      });
    }
  });
});

define('lolma-us/serializers/project-info', ['exports', 'lolma-us/serializers/_json', 'npm:lodash'], function (exports, _json, _npmLodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _json.default.extend({

    // ----- Overridden properties -----
    primaryKey: 'full_name',

    // ----- Overridden methods -----
    keyForAttribute: function keyForAttribute(key, method) {
      return Ember.String.underscore(key);
    },
    normalize: function normalize(primaryModelClass, payload) {
      var newPayload = _npmLodash.default.pick(payload, ['stargazers_count', 'full_name']);
      return this._super(primaryModelClass, newPayload);
    }
  });
});

define('lolma-us/serializers/stackoverflow-user', ['exports', 'lolma-us/serializers/_json'], function (exports, _json) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

  exports.default = _json.default.extend({

    // ----- Overridden properties -----
    primaryKey: 'user_id',

    // ----- Overridden methods -----
    keyForAttribute: function keyForAttribute(key, method) {
      return Ember.String.underscore(key);
    },
    normalize: function normalize(primaryModelClass, payload) {
      var user = payload.items[0];
      var newPayload = _extends({
        user_id: user.user_id,
        reputation: user.reputation
      }, user.badge_counts);
      return this._super(primaryModelClass, newPayload);
    },
    serialize: function serialize(snapshot, options) {
      var _super = this._super(snapshot, options),
          user_id = _super.user_id,
          reputation = _super.reputation,
          bronze = _super.bronze,
          silver = _super.silver,
          gold = _super.gold;

      return {
        items: [{
          user_id: parseInt(user_id, 10),
          reputation: reputation,
          badge_counts: { bronze: bronze, silver: silver, gold: gold }
        }]
      };
    }
  });
});

define('lolma-us/services/config', ['exports', 'lolma-us/config/environment', 'ember-awesome-macros', 'ember-macro-helpers/raw', 'ember-macro-helpers/reads'], function (exports, _environment, _emberAwesomeMacros, _raw, _reads) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({

    // ----- Services -----
    fastboot: Ember.inject.service(),
    i18n: Ember.inject.service(),

    // ----- Overridden properties -----


    // ----- Static properties -----
    environment: _environment.default.environment,
    envVars: _environment.default.envVars,
    host: (0, _reads.default)('envVars.LMS_HOST'),
    gatekeeperUrl: (0, _reads.default)('envVars.LMS_GATEKEEPER_URL'),
    namespace: '/content',

    // ----- Computed properties -----
    contentApiHost: (0, _emberAwesomeMacros.conditional)('fastboot.isFastBoot', (0, _raw.default)('http://127.0.0.1:8081'), 'host'),
    isDev: (0, _emberAwesomeMacros.equal)('environment', (0, _raw.default)('development')),
    isTest: (0, _emberAwesomeMacros.equal)('environment', (0, _raw.default)('test')),
    isProd: (0, _emberAwesomeMacros.equal)('environment', (0, _raw.default)('production'))

    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----

  });
});

define('lolma-us/services/cookies', ['exports', 'ember-cookies/services/cookies'], function (exports, _cookies) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _cookies.default.extend({

    // ----- Services -----


    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----


    // ----- Overridden Methods -----

    // https://github.com/simplabs/ember-cookies/pull/27
    _filterCachedFastBootCookies: function _filterCachedFastBootCookies(fastBootCookiesCache) {
      var _get = this.get('_fastBoot.request'),
          requestPath = _get.path,
          protocol = _get.protocol;

      // cannot use deconstruct here


      var host = this.get('_fastBoot.request.host');

      return Ember.A(Object.keys(fastBootCookiesCache)).reduce(function (acc, name) {
        var _fastBootCookiesCache = fastBootCookiesCache[name],
            value = _fastBootCookiesCache.value,
            options = _fastBootCookiesCache.options;

        options = options || {};

        var _options = options,
            optionsPath = _options.path,
            domain = _options.domain,
            expires = _options.expires,
            secure = _options.secure;


        if (optionsPath && requestPath && requestPath.indexOf(optionsPath) !== 0) {
          return acc;
        }

        if (domain && host.indexOf(domain) + domain.length !== host.length) {
          return acc;
        }

        if (expires && expires < new Date()) {
          return acc;
        }

        if (secure && protocol !== 'https') {
          return acc;
        }

        acc[name] = value;
        return acc;
      }, {});
    }
  }

  // ----- Custom Methods -----


  // ----- Events and observers -----


  // ----- Tasks -----

  );
});

define('lolma-us/services/fastboot', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var deprecate = Ember.deprecate,
      computed = Ember.computed,
      get = Ember.get,
      assert = Ember.assert;
  var deprecatingAlias = computed.deprecatingAlias,
      readOnly = computed.readOnly;


  var RequestObject = Ember.Object.extend({
    init: function init() {
      this._super.apply(this, arguments);

      var request = this.request;
      delete this.request;

      this.method = request.method;
      this.body = request.body;
      this.cookies = request.cookies;
      this.headers = request.headers;
      this.queryParams = request.queryParams;
      this.path = request.path;
      this.protocol = request.protocol;
      this._host = function () {
        return request.host();
      };
    },


    host: computed(function () {
      return this._host();
    })
  });

  var Shoebox = Ember.Object.extend({
    put: function put(key, value) {
      assert('shoebox.put is only invoked from the FastBoot rendered application', this.get('fastboot.isFastBoot'));
      assert('the provided key is a string', typeof key === 'string');

      var fastbootInfo = this.get('fastboot._fastbootInfo');
      if (!fastbootInfo.shoebox) {
        fastbootInfo.shoebox = {};
      }

      fastbootInfo.shoebox[key] = value;
    },
    retrieve: function retrieve(key) {
      if (this.get('fastboot.isFastBoot')) {
        var shoebox = this.get('fastboot._fastbootInfo.shoebox');
        if (!shoebox) {
          return;
        }

        return shoebox[key];
      }

      var shoeboxItem = this.get(key);
      if (shoeboxItem) {
        return shoeboxItem;
      }

      var el = document.querySelector('#shoebox-' + key);
      if (!el) {
        return;
      }
      var valueString = el.textContent;
      if (!valueString) {
        return;
      }

      shoeboxItem = JSON.parse(valueString);
      this.set(key, shoeboxItem);

      return shoeboxItem;
    }
  });

  var FastBootService = Ember.Service.extend({
    cookies: deprecatingAlias('request.cookies', { id: 'fastboot.cookies-to-request', until: '0.9.9' }),
    headers: deprecatingAlias('request.headers', { id: 'fastboot.headers-to-request', until: '0.9.9' }),
    isFastBoot: typeof FastBoot !== 'undefined',

    init: function init() {
      this._super.apply(this, arguments);

      var shoebox = Shoebox.create({ fastboot: this });
      this.set('shoebox', shoebox);
    },


    host: computed(function () {
      deprecate('Usage of fastboot service\'s `host` property is deprecated.  Please use `request.host` instead.', false, { id: 'fastboot.host-to-request', until: '0.9.9' });

      return this._fastbootInfo.request.host();
    }),

    response: readOnly('_fastbootInfo.response'),
    metadata: readOnly('_fastbootInfo.metadata'),

    request: computed(function () {
      if (!this.isFastBoot) return null;
      return RequestObject.create({ request: get(this, '_fastbootInfo.request') });
    }),

    deferRendering: function deferRendering(promise) {
      assert('deferRendering requires a promise or thennable object', typeof promise.then === 'function');
      this._fastbootInfo.deferRendering(promise);
    }
  });

  exports.default = FastBootService;
});

define('lolma-us/services/head-data', ['exports', 'ember-cli-head/services/head-data', 'ember-macro-helpers/computed', 'lodash'], function (exports, _headData, _computed, _lodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _headData.default.extend({
    model: null,

    linkedData: (0, _computed.default)('model.linkedData', function (linkedData) {
      return {
        '@context': 'http://schema.org',
        '@graph': _lodash.default.values(linkedData || {})
      };
    })
  });
});

define('lolma-us/services/html-state', ['exports', 'npm:lodash'], function (exports, _npmLodash) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({

    // ----- Services -----
    fastboot: Ember.inject.service(),

    // ----- Overridden properties -----


    // ----- Static properties -----
    htmlStateIsRestored: false,

    // ----- Computed properties -----
    menuToggler: Ember.computed(function () {
      if (this.get('fastboot.isFastBoot')) return false;
      return window.lolmausHtmlState['#route-locale-menuToggler'].value;
    }),

    timelineShowDetails: Ember.computed(function () {
      if (this.get('fastboot.isFastBoot')) return false;
      return window.lolmausHtmlState['.timeLine-showDetails'].value;
    }),

    showStalledProjects: Ember.computed(function () {
      if (this.get('fastboot.isFastBoot')) return false;
      return window.lolmausHtmlState['.proJects-stalledInput'].value;
    }),

    // ----- Overridden Methods -----


    // ----- Custom Methods -----
    restoreHtmlState: function restoreHtmlState() {
      if (this.get('htmlStateIsRestored') || !window.lolmausHtmlState) return;

      Ember.run.scheduleOnce('afterRender', this, this._restoreHtmlState);
    },
    _restoreHtmlState: function _restoreHtmlState() {
      this.set('htmlStateIsRestored', true);

      _npmLodash.default.forOwn(window.lolmausHtmlState, function (_ref, selector) {
        var type = _ref.type,
            value = _ref.value;

        switch (type) {
          // case 'checkbox':
          //   break
          case 'vertical-scroll':
            Ember.$(selector).scrollTop(value);
            break;
        }
      });
    }
  }

  // ----- Events and observers -----


  // ----- Tasks -----

  );
});

define('lolma-us/services/i18n', ['exports', 'ember-i18n/services/i18n'], function (exports, _i18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _i18n.default.extend({

    // ----- Services -----


    // ----- Overridden properties -----


    // ----- Static properties -----


    // ----- Computed properties -----
    oppositeLocale: Ember.computed('locale', function () {
      return this.get('locale') === 'en' ? 'ru' : 'en';
    })

    // ----- Overridden Methods -----


    // ----- Custom Methods -----


    // ----- Events and observers -----


    // ----- Tasks -----

  });
});

define('lolma-us/services/metrics', ['exports', 'ember-metrics/services/metrics'], function (exports, _metrics) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _metrics.default;
    }
  });
});

define('lolma-us/services/moment', ['exports', 'ember-moment/services/moment', 'lolma-us/config/environment'], function (exports, _moment, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var get = Ember.get;
  exports.default = _moment.default.extend({
    defaultFormat: get(_environment.default, 'moment.outputFormat')
  });
});

define('lolma-us/services/popup', ['exports', 'torii/services/popup'], function (exports, _popup) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _popup.default;
    }
  });
});

define('lolma-us/services/rollbar', ['exports', 'ember-rollbar-client/services/rollbar'], function (exports, _rollbar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rollbar.default;
    }
  });
});

define('lolma-us/services/session', ['exports', 'ember-simple-auth/services/session'], function (exports, _session) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _session.default;
});

define('lolma-us/services/torii-session', ['exports', 'torii/services/torii-session'], function (exports, _toriiSession) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toriiSession.default;
    }
  });
});

define('lolma-us/services/torii', ['exports', 'torii/services/torii'], function (exports, _torii) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _torii.default;
    }
  });
});

define('lolma-us/session-stores/application', ['exports', 'ember-simple-auth/session-stores/cookie'], function (exports, _cookie) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _cookie.default.extend({

    // ----- Services -----
    _secureCookies: Ember.computed(function () {
      if (this.get('_fastboot.isFastBoot')) return this.get('_fastboot.request.protocol') === 'https';
      return window.location.protocol === 'https:';
    }).volatile()
  });
});

define("lolma-us/templates/head", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cDSWYOZS", "block": "{\"symbols\":[\"keyword\"],\"statements\":[[0,\"\\n\"],[6,\"title\"],[7],[1,[20,[\"model\",\"title\"]],false],[8],[0,\"\\n\"],[6,\"meta\"],[9,\"property\",\"og:title\"],[10,\"content\",[25,\"or\",[[20,[\"model\",\"model\",\"post\",\"title\"]],[20,[\"model\",\"title\"]]],null],null],[7],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"model\",\"redirectToEn\"]]],null,{\"statements\":[[0,\"  \"],[6,\"meta\"],[9,\"http-equiv\",\"refresh\"],[9,\"content\",\"0; url=/en/blog/\"],[7],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[20,[\"model\",\"model\",\"locale\"]]],null,{\"statements\":[[0,\"  \"],[6,\"meta\"],[9,\"property\",\"og:locale\"],[10,\"content\",[20,[\"model\",\"model\",\"locale\"]],null],[7],[8],[0,\"\\n  \"],[6,\"link\"],[9,\"rel\",\"alternate\"],[9,\"type\",\"application/rss+xml\"],[10,\"href\",[26,[\"https://lolma.us/rss_\",[20,[\"model\",\"model\",\"locale\"]],\".xml\"]]],[7],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[20,[\"model\",\"model\",\"post\",\"summary\"]]],null,{\"statements\":[[0,\"  \"],[6,\"meta\"],[9,\"property\",\"og:description\"],[10,\"content\",[20,[\"model\",\"model\",\"post\",\"summary\"]],null],[7],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[6,\"meta\"],[9,\"property\",\"og:image\"],[10,\"content\",[25,\"or\",[[20,[\"model\",\"model\",\"post\",\"image\"]],\"https://lolma.us/favicon.jpg\"],null],null],[7],[8],[0,\"\\n\\n\"],[6,\"meta\"],[9,\"property\",\"og:type\"],[10,\"content\",[25,\"or\",[[20,[\"model\",\"model\",\"ogType\"]],\"website\"],null],null],[7],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"model\",\"model\",\"post\"]]],null,{\"statements\":[[0,\"  \"],[6,\"link\"],[9,\"rel\",\"canonical\"],[10,\"href\",[20,[\"model\",\"model\",\"post\",\"url\"]],null],[7],[8],[0,\"\\n  \"],[6,\"meta\"],[9,\"property\",\"og:url\"],[10,\"content\",[20,[\"model\",\"model\",\"post\",\"url\"]],null],[7],[8],[0,\"\\n  \"],[6,\"meta\"],[9,\"property\",\"article:published_time\"],[10,\"content\",[25,\"iso-date\",[[20,[\"model\",\"model\",\"post\",\"created\"]]],null],null],[7],[8],[0,\"\\n  \"],[6,\"meta\"],[9,\"property\",\"article:author\"],[10,\"content\",[26,[\"https://lolma.us/\",[20,[\"model\",\"model\",\"locale\"]],\"/\"]]],[7],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"model\",\"model\",\"post\",\"updated\"]]],null,{\"statements\":[[0,\"    \"],[6,\"meta\"],[9,\"property\",\"article:modified_time\"],[10,\"content\",[25,\"iso-date\",[[20,[\"model\",\"model\",\"post\",\"updated\"]]],null],null],[7],[8],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"each\",[[20,[\"model\",\"model\",\"post\",\"keywords\"]]],null,{\"statements\":[[0,\"    \"],[6,\"meta\"],[9,\"property\",\"article:tag\"],[10,\"content\",[19,1,[]],null],[7],[8],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[20,[\"model\",\"linkedData\"]]],null,{\"statements\":[[0,\"  \"],[6,\"script\"],[9,\"type\",\"application/ld+json\"],[7],[1,[25,\"json-stringify\",[[20,[\"model\",\"linkedData\"]]],null],false],[8],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "lolma-us/templates/head.hbs" } });
});

define('lolma-us/torii-providers/github-oauth2', ['exports', 'ember-awesome-macros', 'torii/providers/github-oauth2'], function (exports, _emberAwesomeMacros, _githubOauth) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _templateObject = _taggedTemplateLiteral(['', '/torii/redirect.html'], ['', '/torii/redirect.html']);

  function _taggedTemplateLiteral(strings, raw) {
    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }

  exports.default = _githubOauth.default.extend({

    // ----- Services -----
    config: Ember.inject.service(),

    // ----- Overridden methods -----
    fetch: function fetch(data) {
      return data;
    },


    redirectUri: (0, _emberAwesomeMacros.tag)(_templateObject, 'config.host')
  });
});

define('lolma-us/transforms/date', ['exports', 'ember-data/transforms/date'], function (exports, _date) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _date.default.extend({
    deserialize: function deserialize(input) {
      if (input instanceof Date) return input;
      return this._super.apply(this, arguments);
    }
  });
});

define('lolma-us/utils/can-use-dom', ['exports', 'ember-metrics/utils/can-use-dom'], function (exports, _canUseDom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _canUseDom.default;
    }
  });
});

define('lolma-us/utils/disqus-cache', ['exports', 'ember-disqus/utils/disqus-cache'], function (exports, _disqusCache) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _disqusCache.default;
    }
  });
});

define('lolma-us/utils/fetch-github', ['exports', 'fetch'], function (exports, _fetch) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = fetchGitHub;

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

  function fetchGitHub(url, sessionServiceOrToken) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$mode = _ref.mode,
        mode = _ref$mode === undefined ? 'json' : _ref$mode,
        _ref$method = _ref.method,
        method = _ref$method === undefined ? 'GET' : _ref$method;

    var sessionService = void 0,
        token = void 0;

    if (typeof sessionServiceOrToken === 'string') {
      token = sessionServiceOrToken;
    } else {
      sessionService = sessionServiceOrToken;
      token = sessionService.get('data.authenticated.token');
    }

    var fullUrl = 'https://api.github.com/' + url;

    return (0, _fetch.default)(fullUrl, {
      method: method,
      headers: _extends({
        Accept: 'application/vnd.github.v3+json'
      }, token ? { Authorization: 'token ' + token } : {})
    }).then(function (response) {
      if (method && response.status >= 400) return Ember.RSVP.reject(response);
      return response;
    }).then(function (response) {
      return mode === 'json' ? response.json() : mode === 'text' ? response.text() : response;
    }).catch(function (response) {
      if (response.status === 401 && sessionService && sessionService.get('isAuthenticated')) {
        sessionService.invalidate();
        return null;
      }

      return Ember.RSVP.reject(response);
    });
  }
});

define('lolma-us/utils/fetch-rsvp', ['exports', 'fetch'], function (exports, _fetch) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.fetchRsvpText = fetchRsvpText;
  exports.default = fetchRsvpJson;
  function fetchRsvpText() {
    return _fetch.default.apply(undefined, arguments).then(function (response) {
      if (response.status < 400) return response;
      return Ember.RSVP.reject(response);
    }).then(function (response) {
      return response.text();
    });
  }

  function fetchRsvpJson() {
    return _fetch.default.apply(undefined, arguments).then(function (response) {
      if (response.status >= 400) return Ember.RSVP.reject(response); // fetch treats errors as non-errors
      return response;
    }).then(function (response) {
      return response.json();
    });
  }
});

define('lolma-us/utils/i18n/compile-template', ['exports', 'ember-i18n/utils/i18n/compile-template'], function (exports, _compileTemplate) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _compileTemplate.default;
    }
  });
});

define('lolma-us/utils/i18n/missing-message', ['exports', 'ember-i18n/utils/i18n/missing-message'], function (exports, _missingMessage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _missingMessage.default;
    }
  });
});

define('lolma-us/utils/load-disqus-api', ['exports', 'ember-disqus/utils/load-filepicker-api'], function (exports, _loadFilepickerApi) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _loadFilepickerApi.default;
    }
  });
});

define('lolma-us/utils/object-transforms', ['exports', 'ember-metrics/utils/object-transforms'], function (exports, _objectTransforms) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _objectTransforms.default;
    }
  });
});

define("lolma-us/utils/random-string", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = randomString;
  function randomString() {
    return Math.random().toString(36).substr(2);
  }
});

define('lolma-us/utils/wait', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = wait;
  function wait() {
    var ms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;

    return new Ember.RSVP.Promise(function (resolve) {
      return setTimeout(resolve, ms);
    });
  }
});



define('lolma-us/config/environment', [], function() {
  if (typeof FastBoot !== 'undefined') {
return FastBoot.config('lolma-us');
} else {
var prefix = 'lolma-us';try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

}
});


if (typeof FastBoot === 'undefined') {
  if (!runningTests) {
    require('lolma-us/app')['default'].create({"name":"lolma-us","version":"0.0.0+1b57ddef"});
  }
}

define('~fastboot/app-factory', ['lolma-us/app', 'lolma-us/config/environment'], function(App, config) {
  App = App['default'];
  config = config['default'];

  return {
    'default': function() {
      return App.create(config.APP);
    }
  };
});

//# sourceMappingURL=lolma-us.map
