angular.module('registration',[])
.config(['$stateProvider', function($stateProvider) {

	const templateBase = 'app/modules/registration/';

    const returnCtrlAs = function(name, asPrefix) {
        return name + 'Ctrl as ' + (asPrefix? asPrefix : '') + (asPrefix? name[0].toUpperCase() + name.slice(1, name.length) : name);
    };

    $stateProvider
	.state('registration', {
		url: '/register',
        templateUrl: templateBase + 'registration.html',
        menu:{
                desktop:false,
                mobile:false
        }
    })
    .state('registration.invited', {
        url: '/invitation?id&code',
        templateUrl: templateBase + 'userInvited/userInvited.html',
        controller: returnCtrlAs('usersRegister'),
        menu:{
                desktop:false,
                mobile:false
        }
    })
    .state('registration.walkup', {
        url: '/walkup',
        templateUrl:templateBase + 'userWalkup/userWalkup.html',
        controller: returnCtrlAs('userWalkup'),
        menu:{
                desktop:false,
                mobile:false
        }
    })
    .state('registration.tlo', {
        url: '/top-level-org',
        templateUrl: templateBase + 'newTopLevelOrg/newTLO.html',
        controller: returnCtrlAs('tlo','new'),
        menu:{
                desktop:false,
                mobile:false
        }
    })
    .state('registration.division', {
        url: '/new-division',
        templateUrl: templateBase + 'newDivision/newDivision.html',
        controller: returnCtrlAs('division','new'),
        menu:{
                desktop:false,
                mobile:false
        }
    });

}]);
