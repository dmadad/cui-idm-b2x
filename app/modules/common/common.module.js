angular.module('common',['translate','ngMessages','cui.authorization','cui-ng','ui.router','snap','LocalStorageModule'])
.config(['$translateProvider','$locationProvider','$urlRouterProvider','$injector','localStorageServiceProvider',
    '$cuiIconProvider','$cuiI18nProvider','$paginationProvider','$stateProvider','$compileProvider',
function($translateProvider,$locationProvider,$urlRouterProvider,$injector,localStorageServiceProvider,$cuiIconProvider,
    $cuiI18nProvider,$paginationProvider,$stateProvider,$compileProvider) {

    localStorageServiceProvider.setPrefix('cui');
    // $locationProvider.html5Mode(true);

    const templateBase = 'app/modules/common/';

    const returnCtrlAs = (name, asPrefix) => `${name}Ctrl as ${ asPrefix || ''}${(asPrefix? name[0].toUpperCase() + name.slice(1, name.length) : name)}`;

    const loginRequired = {
        loginRequired:true
    };

    $stateProvider
    .state('auth', {
        url: '/auth',
        controller: returnCtrlAs('auth'),
        templateUrl: templateBase + 'auth/auth.html',
        access:loginRequired
    });

    if (appConfig.languages) {
        $cuiI18nProvider.setLocaleCodesAndNames(appConfig.languages);
        let languageKeys = Object.keys($cuiI18nProvider.getLocaleCodesAndNames());

        const returnRegisterAvailableLanguageKeys = () => {
            // Reroute unknown language to prefered language
            let object = {'*': languageKeys[0]};
            languageKeys.forEach(function(languageKey) {
                // Redirect language keys such as en_US to en
                object[languageKey + '*'] = languageKey;
            });
            return object;
        };

        $translateProvider.useLoader('LocaleLoader', {
            url: 'bower_components/cui-i18n/dist/cui-i18n/angular-translate/',
            prefix: 'locale-',
            suffix: '.json'
        })
        .registerAvailableLanguageKeys(languageKeys, returnRegisterAvailableLanguageKeys())
        .uniformLanguageTag('java')
        .determinePreferredLanguage()
        .fallbackLanguage(languageKeys);

        $cuiI18nProvider.setLocalePreference(languageKeys);
    }

    if (appConfig.iconSets) {
        appConfig.iconSets.forEach((iconSet) => {
            $cuiIconProvider.iconSet(iconSet.name, iconSet.path, iconSet.defaultViewBox || null);
        });
    }

    // Pagination Results Per Page Options
    if (appConfig.paginationOptions) {
        $paginationProvider.setPaginationOptions(appConfig.paginationOptions);
    }

    $compileProvider.debugInfoEnabled(false);

}]);

angular.module('common')
.run(['LocaleService','$rootScope','$state','$http','$templateCache','$cuiI18n','User',
    'cui.authorization.routing','Menu','API','$cuiIcon','$timeout','PubSub',
function(LocaleService,$rootScope,$state,$http,$templateCache,$cuiI18n,User,routing,Menu,API,$cuiIcon,$timeout,PubSub) {

    // Add locales here
    const languageNameObject = $cuiI18n.getLocaleCodesAndNames();

    for (var LanguageKey in languageNameObject) {
        LocaleService.setLocales(LanguageKey, languageNameObject[LanguageKey]);
    }

    $rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
        if(!toState.access || !toState.access.loginRequired) {
            Menu.handleStateChange(toState.menu);
            PubSub.publish('stateChange',{ toState,toParams,fromState,fromParams }); // this is required to make the ui-sref-active-nested directive work with a multi-module approach
            return;
        }
        event.preventDefault();
        API.handleStateChange({ toState,toParams,fromState,fromParams })
        .then((res) => {
            // Determine if user is able to access the particular route we're navigation to
            const { toState, toParams, fromState, fromParams } = res.redirect;
            routing(toState, toParams, fromState, fromParams, res.roleList);
            PubSub.publish('stateChange',{ toState, toParams, fromState, fromParams }); // this is required to make the ui-sref-active-nested directive work with a multi-module approach
            // Menu handling
            Menu.handleStateChange(res.redirect.toState.menu);
        });
    });

    $rootScope.$on('$stateChangeSuccess', (e, { toState, toParams, fromState, fromParams }) => {
        // For base.goBack()
        $state.previous = {};
        $state.previous.name = fromState;
        $state.previous.params = fromParams;
    });

    angular.forEach($cuiIcon.getIconSets(), (iconSettings, namespace) => {
        $http.get(iconSettings.path, {
            cache: $templateCache
        });
    });

}]);
