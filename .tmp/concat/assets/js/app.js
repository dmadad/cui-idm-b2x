(function(angular){
    'use strict';

    angular
    .module('app',['translate','ngMessages','cui.authorization','cui-ng','ui.router','snap','LocalStorageModule'])
    .run(['$rootScope', '$state', 'cui.authorization.routing', function($rootScope,$state,routing){
        // $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        //     event.preventDefault();
        //     routing($rootScope, $state, toState, toParams, fromState, fromParams);
        // })
    }]);

angular.module('app')
.factory('API',[function(){
    
    var myCUI= cui.api();
    myCUI.setServiceUrl('https://api.covapp.io');
    
    var doAuth = function(){
        return myCUI.doSysAuth({
            clientId: 'wntKAjev5sE1RhZCHzXQ7ko2vCwq3wi2',
            clientSecret: 'MqKZsqUtAVAIiWkg'
        });
    };

    var token = function(){
        return myCUI.getToken();
    };

    var url = function(){
        return myCUI.getService();
    };

    doAuth();

    return{
        token:token,
        url:url,
        cui:myCUI,
        doAuth:doAuth
    };
}]);

angular.module('app')
.controller('baseCtrl',['$state','getCountries','$scope','$translate',
function($state,getCountries,$scope,$translate){
    var base=this;
    
    base.desktopMenu=true;

    base.toggleDesktopMenu=function(){
        base.desktopMenu=!base.desktopMenu;
    };

    base.goBack=function(){
        if($state.previous.name.name!==''){
            $state.go($state.previous.name,$state.previous.params);
        }
        else {
            $state.go('base');
        }
    };


    var setCountries=function(language){
        if(language.indexOf('_')>-1){
            language=language.split('_')[0];   
        }
        getCountries(language)
        .then(function(res){
            base.countries=res.data;
        })
        .catch(function(err){
            console.log(err);
        });
    }

    $scope.$on('languageChange',function(e,args){
        setCountries(args);
    });

    setCountries($translate.proposedLanguage());


}]);

angular.module('app')
.config(['$translateProvider','$locationProvider','$stateProvider','$urlRouterProvider','$injector','localStorageServiceProvider',
function($translateProvider,$locationProvider,$stateProvider,$urlRouterProvider,$injector,localStorageServiceProvider){
    localStorageServiceProvider.setPrefix('cui');
    $stateProvider
        .state('base',{
            url: '/',
            templateUrl: 'assets/angular-templates/home.html',
            controller: 'baseCtrl as base'
        })
        .state('users',{
            url: '/users',
            templateUrl: 'assets/angular-templates/users/users.html'
        })
        .state('users.search',{
            url: '/',
            templateUrl: 'assets/angular-templates/users/users.search.html',
            controller: 'usersSearchCtrl as usersSearch'
        })
        .state('users.edit',{
            url: '/edit/:id',
            templateUrl: 'assets/angular-templates/users/users.edit.html',
            controller: 'usersEditCtrl as usersEdit'
        })
        .state('users.invitations',{
            url: '/invitations',
            templateUrl: 'assets/angular-templates/users/users.invitations.search.html',
            controller: 'usersInvitationsCtrl as usersInvitations'
        })
        .state('users.invitations.view',{
            url: '/view',
            templateUrl: 'assets/angular-templates/users/users.invitations.view.html',
            controller: 'userInvitationsViewCtrl as usersInvitationsView'
        })
        .state('users.invite',{
            url: '/invite',
            templateUrl: 'assets/angular-templates/users/users.invite.html',
            controller: 'usersInviteCtrl as usersInvite'
        })
        .state('users.register',{
            url: '/register?id&code',
            templateUrl: 'assets/angular-templates/users/users.register.html',
            controller: 'usersRegisterCtrl as usersRegister'
        })
        .state('users.walkupRegistration',{
            url: '/walkupRegistration',
            templateUrl:'assets/angular-templates/users/users.walkup.html',
            controller: 'usersWalkupCtrl as usersWalkup'
        })
        .state('users.activate',{
            url: '/activate/:id',
            templateUrl: 'assets/angular-templates/users/users.activate.html',
            controller: 'usersActivateCtrl as usersActivate'
        })
        .state('sysAdmin',{
            url: '/sysAdmin',
            templateUrl: 'assets/angular-templates/sysAdmin/sysAdmin.html',
        })
        .state('sysAdmin.account',{
            url: '/sysAdmin/account/',
            templateUrl: 'assets/angular-templates/sysAdmin/sysAdmin.account.html',
            controller: 'sysAdminAccountCtrl as sysAdminAccount'
        });
    // $locationProvider.html5Mode(true);
    
    //fixes infinite digest loop with ui-router
    $urlRouterProvider.otherwise( function($injector) {
      var $state = $injector.get("$state");
      $state.go('base');
    });

    
    //where the locales are being loaded from
    $translateProvider.useLoader('LocaleLoader',{
        url:'bower_components/cui-i18n/dist/cui-i18n/angular-translate/',
        prefix:'locale-'
    });
     
}]);

angular.module('app')
.run(['LocaleService','$rootScope','$state',function(LocaleService,$rootScope,$state){
    //add more locales here
    LocaleService.setLocales('en_US','English (United States)');
    LocaleService.setLocales('pl_PL','Polish (Poland)');
    LocaleService.setLocales('zh_CN', 'Chinese (Simplified)');
    LocaleService.setLocales('pt_PT','Portuguese (Portugal)');

    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        $state.previous = {};
        $state.previous.name = fromState;
        $state.previous.params = fromParams;
    });
}]);



angular.module('app').factory('getCountries',['$http',function($http){
    return function(locale){
        return $http.get('bower_components/cui-i18n/dist/cui-i18n/angular-translate/countries/' + locale + '.json');
    };
}]);

angular.module('app')
.factory('Person',['$http','$q','API',function($http,$q,API){


    
    var getPeople=function(){
        return API.cui.getPersons;
    };

    var getById=function(id){
        return $http({
            method:'GET',
            url:API.cui.getServiceUrl() + '/person/v1/persons/' + id,
            headers:{
                Accept:'application/vnd.com.covisint.platform.person.v1+json',
                Authorization:'Bearer ' + API.token()
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(res){
            return $q.reject(res);
        });
    };

    var getInvitations=function(){
        return $http({
            method:'GET',
            url:API.cui.getServiceUrl() + '/person/v1/personInvitations/',
            headers:{
                Accept:'application/vnd.com.covisint.platform.person.invitation.v1+json',
                Authorization:'Bearer ' + API.token()
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(res){
            return $q.reject(res);
        });
    };

    var getInvitationById=function(id){
        return $http({
            method:'GET',
            url:API.cui.getServiceUrl() + '/person/v1/personInvitations/' + id,
            headers:{
                Accept:'application/vnd.com.covisint.platform.person.invitation.v1+json',
                Authorization:'Bearer ' + API.token()
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(res){
            return $q.reject(res);
        });
    };

    var createInvitation=function(invitee,invitor){
        return $http({
            method:'POST',
            url:API.cui.getServiceUrl() + '/person/v1/personInvitations',
            headers:{
                Accept:'application/vnd.com.covisint.platform.person.invitation.v1+json',
                Authorization:'Bearer ' + API.token(),
                'Content-type':'application/vnd.com.covisint.platform.person.invitation.v1+json'
            },
            data:{
                email:invitee.email,
                invitor:{
                    id:invitor.id,
                    type:'person'
                },
                invitee:{
                    id:invitee.id,
                    type:'person'
                },
                targetOrganization:{
                    "id":"OCOVSMKT-CVDEV204002",
                    "type":"organization"
                }
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(res){
            return $q.reject(res);
        });
    };

    var update=function(id,data){
        return $http({
            method:'PUT',
            url:API.cui.getServiceUrl() + '/person/v1/persons/' + id,
            headers:{
                Accept:'application/vnd.com.covisint.platform.person.v1+json',
                Authorization:'Bearer ' + API.token(),
                'Content-Type':'application/vnd.com.covisint.platform.person.v1+json'
            },
            data:data
        })
        .then(function(res){
            return res;
        })
        .catch(function(res){
            return $q.reject(res);
        });
    };

    var create=function(data){
        return $http({
            method:'POST',
            url:API.cui.getServiceUrl() + '/person/v1/persons',
            headers:{
                Accept:'application/vnd.com.covisint.platform.person.v1+json',
                Authorization:'Bearer ' + API.token(),
                'Content-Type':'application/vnd.com.covisint.platform.person.v1+json'
            },
            data:data
        })
        .then(function(res){
            return res;
        })
        .catch(function(res){
            return $q.reject(res);
        });
    };

    var sendUserInvitationEmail=function(body){
        return $http({
            'method':'POST',
            'url':'http://localhost:8000/invitation/person',
            'Content-Type': 'application/json',
            'data':body
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var getSecurityQuestions=function(){
        return $http({
            method:'GET',
            url: API.cui.getServiceUrl() + '/authn/v2/securityQuestions',
            headers:{
                Accept:'application/vnd.com.covisint.platform.securityquestion.v1+json',
                Authorization:'Bearer ' + API.token()
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var getPasswordAccount=function(id){
        return $http({
            method:'GET',
            url: API.cui.getServiceUrl() + '/person/v1/persons/' + id + '/accounts/password',
            headers:{
                Accept: 'application/vnd.com.covisint.platform.person.account.password.v1+json',
                Authorization:'Bearer ' + API.token()
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var createPasswordAccount=function(id,data){
        return $http({
            method: 'PUT',
            url: API.cui.getServiceUrl() + '/person/v1/persons/' + id + '/accounts/password',
            headers: {
                Accept: 'application/vnd.com.covisint.platform.person.account.password.v1+json',
                Authorization: 'Bearer ' + API.token(),
                'Content-Type': 'application/vnd.com.covisint.platform.person.account.password.v1+json'
            },
            data:data
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var createSecurityQuestions=function(id,data){
        return $http({
            method: 'PUT',
            url: API.cui.getServiceUrl() + '/authn/v2/persons/' + id + '/accounts/securityQuestion',
            headers: {
                Accept: 'application/vnd.com.covisint.platform.person.account.securityQuestion.v1+json',
                Authorization: 'Bearer ' + API.token(),
                'Content-Type': 'application/vnd.com.covisint.platform.person.account.securityQuestion.v1+json'
            },
            data:data
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var grantExchangePackage=function(id){
        return $http({
            method:'PUT',
            url: API.cui.getServiceUrl() + '/service/v1/persons/' + id + '/packages/PCOVSMKT-CVDEV204003000',
            headers:{
                Accept: 'application/vnd.com.covisint.platform.package.grant.v1+json',
                Authorization : 'Bearer ' + API.token(),
                'Content-Type': 'application/vnd.com.covisint.platform.package.grant.v1+json',
            },
            data:{
                "version": 1,
                "grantee": {
                    "id": id,
                    "type": "person"
                },
                "servicePackage": {
                    "id": "PCOVSMKT-CVDEV204003000"
                }
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var grantCcaPackage=function(id){
        return $http({
            method:'PUT',
            url: API.cui.getServiceUrl() + '/service/v1/persons/' + id + '/packages/PAPC2040605',
            headers:{
                Accept: 'application/vnd.com.covisint.platform.package.grant.v1+json',
                Authorization : 'Bearer ' + API.token(),
                'Content-Type': 'application/vnd.com.covisint.platform.package.grant.v1+json',
            },
            data:{
                "version": 1,
                "grantee": {
                    "id": id,
                    "type": "person"
                },
                "servicePackage": {
                    "id": "PAPC2040605"
                }
            }
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            return $q.reject(err);
        });
    };

    var person={
        getAll:API.cui.getUsers,
        getById:getById,
        update:update,
        getInvitations:getInvitations,
        create:create,
        createInvitation:createInvitation,
        sendUserInvitationEmail:sendUserInvitationEmail,
        getInvitationById:getInvitationById,
        getSecurityQuestions:getSecurityQuestions,
        getPasswordAccount:getPasswordAccount,
        createPasswordAccount:createPasswordAccount,
        createSecurityQuestions:createSecurityQuestions,
        grantCcaPackage:grantCcaPackage,
        grantExchangePackage:grantExchangePackage
    };


    return person;

}]);

angular.module('app')
.controller('sysAdminAccountCtrl',['$scope', 
	function($scope) {
		var sysAdminAccount = this;

		sysAdminAccount.tosError = [
			{
				test: "test",
				name: 'tosRequired',
				check: function() {
					return sysAdminAccount.tos;
				}
			}
		];
}]); 


angular.module('app')
.controller('usersActivateCtrl',['$stateParams','API','Person',
function($stateParams,API,Person){
    var usersActivate=this;

    var personParams=[{
        name:'personId',
        value: $stateParams.id
    }];

    API.cui.activatePerson({params:personParams})
    .then(function(res){
        return Person.grantCcaPackage($stateParams.id);
    })
    .then(function(res){
        return Person.grantExchangePackage($stateParams.id);
    })
    .then(function(res){
        console.log(res);
    })
    .fail(function(err){
        console.log(err);
    });

}]);

angular.module('app')
.controller('usersEditCtrl',['localStorageService','$scope','$stateParams','$timeout','API',
function(localStorageService,$scope,$stateParams,$timeout,API){
    var usersEdit=this;
    usersEdit.loading=true;

    API.doAuth()
    .then(function(){
        API.cui.getPerson({personId:$stateParams.id})
        .then(function(res){
            usersEdit.loading=false;
            usersEdit.user=res;
            $scope.$apply();
        })
        .fail(function(err){
            usersEdit.loading=false;
            console.log(err);
        });
    });


    usersEdit.save=function(){
        usersEdit.saving=true;
        usersEdit.fail=false;
        usersEdit.success=false;
        API.cui.updatePerson({personId:$stateParams.id,data:usersEdit.user}).
        then(function(res){
            $timeout(function(){
                usersEdit.saving=false;
                usersEdit.success=true;
            },300);
        })
        .fail(function(err){
            $timeout(function(){
                usersEdit.saving=false;
                usersEdit.fail=true;
            },300);
        });
    };

}]);

angular.module('app')
.controller('usersInvitationsCtrl',['localStorageService','$scope','$stateParams','API','$timeout',
function(localStorageService,$scope,$stateParams,API,$timeout){
    var usersInvitations=this;
    usersInvitations.listLoading=true;
    usersInvitations.invitor=[];
    usersInvitations.invitee=[];
    usersInvitations.invitorLoading=[];
    usersInvitations.inviteeLoading=[];


    API.cui.getPersonInvitations()
    .then(function(res){
        usersInvitations.listLoading=false;
        usersInvitations.list=res;
        $scope.$apply();
    })
    .fail(function(err){
        usersInvitations.listLoading=false;
        console.log(err);
    });


    // This is needed to "attach" the invitor's and the invitee's info to the invitation
    // since the only parameter that we have from the invitation API is the ID
    usersInvitations.getInfo=function(invitorId,inviteeId,index){
        if(usersInvitations.invitor[index]===undefined){
            //get invitor's details
            usersInvitations.invitorLoading[index]=true;
            usersInvitations.inviteeLoading[index]=true;

            API.cui.getPerson({personId:invitorId})
            .then(function(res){
                usersInvitations.invitor[index]=res;
                $scope.$apply();
                $timeout(function(){
                    usersInvitations.invitorLoading[index]=false;
                },500);
            })
            .fail(function(err){
                console.log(err);
            });


            //get invitee's details
            API.cui.getPerson({personId:inviteeId})
            .then(function(res){
                usersInvitations.invitee[index]=res;
                $scope.$apply();
                $timeout(function(){
                    usersInvitations.inviteeLoading[index]=false;
                },500);
            })
            .fail(function(err){
                console.log(err);
            });
        }
    };


    // var search=function(){
    //     API.cui.getUser({data:usersSearch.search})
    //     .then(function(res){
    //         usersSearch.list=res;
    //         $scope.$apply();
    //     })
    //     .fail(function(err){
    //         // TBD : error handling
    //         // console.log(err);
    //     });
    // };

    // $scope.$watchCollection('usersSearch.search',search); 

}]);

angular.module('app')
.controller('usersInviteCtrl',['localStorageService','$scope','Person','$stateParams','API',
function(localStorageService,$scope,Person,$stateParams,API){
    var usersInvite=this;
    usersInvite.user={};
    usersInvite.user.organization={ // organization is hardcoded
                                    // will be replaced once auth is in place
        "id": "OCOVSMKT-CVDEV204002",
        "type": "organization",
        "realm": "APPCLOUD"
    };

    var createInvitation=function(invitee){
        Person.createInvitation(invitee,{id:'RN3BJI54'})
        .then(function(res){
            sendInvitationEmail(res.data);
        })
        .catch(function(err){
            usersInvite.sending=false;
            usersInvite.fail=true;
        });
    };

    var sendInvitationEmail=function(invitation){
        var message="You've received an invitation to join our organization.<p>" + 
            "<a href='localhost:9001/#/users/register?id=" + invitation.id + "&code=" + invitation.invitationCode + "'>Click here" +
            " to register</a>.",
            text;
        if(usersInvite.message && usersInvite.message!==''){
            text=usersInvite.message + '<br/><br/>' + message;
        }
        else text=message;
        var emailOpts={
            to:invitation.email,
            from:'cuiInterface@thirdwave.com',
            fromName:'CUI INTERFACE',
            subject: 'Request to join our organization',
            text: text
        };
        Person.sendUserInvitationEmail(emailOpts)
        .then(function(res){   
            usersInvite.sending=false;
            usersInvite.sent=true;
        })
        .catch(function(err){
            usersInvite.sending=false;
            usersInvite.fail=true;
        });
    };

    usersInvite.saveUser=function(form){
        // Sets every field to $touched, so that when the user
        // clicks on 'sent invitation' he gets the warnings
        // for each field that has an error.
        angular.forEach(form.$error, function (field) {
            angular.forEach(field, function(errorField){
                errorField.$setTouched();
            });
        });

        if(form.$valid){
            usersInvite.sending=true;
            usersInvite.sent=false;
            usersInvite.fail=false;
            API.doAuth()
            .then(function(){
                Person.create(usersInvite.user)
                .then(function(res){   
                    createInvitation(res.data);
                })
                .catch(function(err){
                    usersInvite.sending=false;
                    usersInvite.fail=true;
                });

            });

        }
    };



}]);

angular.module('app')
.controller('usersRegisterCtrl',['localStorageService','$scope','Person','$stateParams', 'API',
function(localStorageService,$scope,Person,$stateParams,API){
    var usersRegister=this;
    usersRegister.loading=true;
    usersRegister.userLogin={};
    usersRegister.userLogin.password='';
    usersRegister.registering=false;
    usersRegister.registrationError=false;

    usersRegister.passwordPolicies=[
        {
            'allowUpperChars':true,
            'allowLowerChars':true,
            'allowNumChars':true,
            'allowSpecialChars':true,
            'requiredNumberOfCharClasses':3
        },
        {
            'disallowedChars':'^&*)(#$'
        },
        {
            'min':8,
            'max':18
        },
        {
            'disallowedWords':['password','admin']
        }
    ];

    Person.getInvitationById($stateParams.id)
    .then(function(res){
        if(res.data.invitationCode!==$stateParams.code){
            // Wrong code
            return;
        }
        getUser(res.data.invitee.id);
    })
    .catch(function(err){
        console.log(err);
    });

    // Pre polulates the form with info the admin inserted when he first created the invitation
    var getUser=function(id){
        API.cui.getPerson({personId:id})
        .then(function(res){
            usersRegister.loading=false;
            usersRegister.user=res;
            $scope.$apply();
        })
        .fail(function(err){
            usersRegister.loading=false;
            console.log(err);
        });
    };

    Person.getSecurityQuestions()
    .then(function(res){
        res.data.splice(0,1); // first question has a text of 'none' , this can be removed later;
        // this ensures half the questions get put into the first challenge question dropdown and 
        // half into the other.
        var numberOfQuestions=res.data.length,
            numberOfQuestionsFloor=Math.floor(numberOfQuestions/2);
        usersRegister.userLogin.challengeQuestions1=res.data.slice(0,numberOfQuestionsFloor);
        usersRegister.userLogin.challengeQuestions2=res.data.slice(numberOfQuestionsFloor);
        usersRegister.userLogin.question1=usersRegister.userLogin.challengeQuestions1[0]; 
        usersRegister.userLogin.question2=usersRegister.userLogin.challengeQuestions2[0];
    })
    .catch(function(err){
        console.log(err);
    });

    usersRegister.finish=function(form){
        if(form.$invalid){
            angular.forEach(form.$error, function (field) {
                angular.forEach(field, function(errorField){
                    errorField.$setTouched();
                });
            });
            return;
        }
        
        usersRegister.registering=true;
        
        var passwordAccount={
            username:usersRegister.userLogin.username,
            password:usersRegister.userLogin.password,
            passwordPolicy:{
                "id":"20308ebc-292a-4a64-8b08-17e92cec8d59",
                "type":"passwordPolicy",
                "realm":"COVSMKT-CVDEV"
            },
            authenticationPolicy:{
                "id":"3359e4d2-576f-46ae-93e9-3a5d9d161ce7",
                "type":"authenticationPolicy",
                "realm":"COVSMKT-CVDEV"
            },
            version:1
        };

        var securityQuestions={
            id:usersRegister.user.id,
            questions:[{
                question:{
                    id:usersRegister.userLogin.question1.id,
                    type:'question',
                    realm:'COVSMKT-CVDEV'
                },
                answer:usersRegister.userLogin.challengeAnswer1,
                index:1
            },{
                question:{
                    id:usersRegister.userLogin.question2.id,
                    type:'question',
                    realm:'COVSMKT-CVDEV'
                },
                answer:usersRegister.userLogin.challengeAnswer2,
                index:2
            }],
            version:1
        };


        Person.createPasswordAccount(usersRegister.user.id,passwordAccount)
        .then(function(res){
            return Person.createSecurityQuestions(usersRegister.user.id,securityQuestions)
        })
        .then(function(res){
            return Person.update(usersRegister.user.id,usersRegister.user)
        })
        .then(function(res){
            console.log(res);
            usersRegister.registering=false;
        })
        .catch(function(err){
            console.log(err);
            usersRegister.registrationError=true;
            usersRegister.registering=false;
        });
    };


}]);

angular.module('app')
.controller('usersSearchCtrl',['localStorageService', '$scope','API','Person',
 function(localStorageService, $scope, API,Person){
    var usersSearch=this;
    usersSearch.listLoading=true;

    API.doAuth()
    .then(function(){
        API.cui.getPersons()
        .then(function(res){
            usersSearch.listLoading=false;
            usersSearch.list=res;
            usersSearch.list.splice(0,4); // removes superusers, won't be needed after cui.js uses 3legged auth
            $scope.$apply();
        })
        .fail(function(err){
            usersSearch.listLoading=false;
            // console.log(err);
        });
    });


    var search=function(){
        // this if statement stops the search from executing
        // when the controller first fires  and the search object is undefined/
        // once pagination is impletemented this won't be needed
        if(usersSearch.search){
            console.log(usersSearch.search);
            API.cui.getPersons({data:usersSearch.search})
            .then(function(res){
                usersSearch.list=res;
                $scope.$apply();
            })
            .fail(function(err){
                // TBD : error handling
                // console.log(err);
            });
        }
    };

    $scope.$watchCollection('usersSearch.search',search); 



}]);

angular.module('app')
.controller('usersWalkupCtrl',['localStorageService','$scope','Person','$stateParams', 'API',
function(localStorageService,$scope,Person,$stateParams,API){
    var usersWalkup=this;
    usersWalkup.userLogin={};
    usersWalkup.userLogin.password='';
    usersWalkup.registering=false;
    usersWalkup.registrationError=false;

    usersWalkup.passwordPolicies=[
        {
            'allowUpperChars':true,
            'allowLowerChars':true,
            'allowNumChars':true,
            'allowSpecialChars':true,
            'requiredNumberOfCharClasses':3
        },
        {
            'disallowedChars':'^&*)(#$'
        },
        {
            'min':8,
            'max':18
        },
        {
            'disallowedWords':['password','admin']
        }
    ];

    Person.getInvitationById($stateParams.id)
    .then(function(res){
        if(res.data.invitationCode!==$stateParams.code){
            // Wrong code
            return;
        }
        getUser(res.data.invitee.id);
    })
    .catch(function(err){
        console.log(err);
    });

    // Pre polulates the form with info the admin inserted when he first created the invitation
    var getUser=function(id){
        API.cui.getPerson({personId:id})
        .then(function(res){
            usersWalkup.loading=false;
            usersWalkup.user=res;
            $scope.$apply();
        })
        .fail(function(err){
            usersWalkup.loading=false;
            console.log(err);
        });
    };

    Person.getSecurityQuestions()
    .then(function(res){
        res.data.splice(0,1); // first question has a text of 'none' , this can be removed later;
        // this ensures half the questions get put into the first challenge question dropdown and 
        // half into the other.
        var numberOfQuestions=res.data.length,
            numberOfQuestionsFloor=Math.floor(numberOfQuestions/2);
        usersWalkup.userLogin.challengeQuestions1=res.data.slice(0,numberOfQuestionsFloor);
        usersWalkup.userLogin.challengeQuestions2=res.data.slice(numberOfQuestionsFloor);
        usersWalkup.userLogin.question1=usersWalkup.userLogin.challengeQuestions1[0]; 
        usersWalkup.userLogin.question2=usersWalkup.userLogin.challengeQuestions2[0];
    })
    .catch(function(err){
        console.log(err);
    });

    usersWalkup.finish=function(form){
        if(form.$invalid){
            angular.forEach(form.$error, function (field) {
                angular.forEach(field, function(errorField){
                    errorField.$setTouched();
                });
            });
            return;
        }
        
        usersWalkup.registering=true;
        
        var passwordAccount={
            username:usersWalkup.userLogin.username,
            password:usersWalkup.userLogin.password,
            passwordPolicy:{
                "id":"20308ebc-292a-4a64-8b08-17e92cec8d59",
                "type":"passwordPolicy",
                "realm":"COVSMKT-CVDEV"
            },
            authenticationPolicy:{
                "id":"3359e4d2-576f-46ae-93e9-3a5d9d161ce7",
                "type":"authenticationPolicy",
                "realm":"COVSMKT-CVDEV"
            },
            version:1
        };

        var securityQuestions={
            id:usersWalkup.user.id,
            questions:[{
                question:{
                    id:usersWalkup.userLogin.question1.id,
                    type:'question',
                    realm:'COVSMKT-CVDEV'
                },
                answer:usersWalkup.userLogin.challengeAnswer1,
                index:1
            },{
                question:{
                    id:usersWalkup.userLogin.question2.id,
                    type:'question',
                    realm:'COVSMKT-CVDEV'
                },
                answer:usersWalkup.userLogin.challengeAnswer2,
                index:2
            }],
            version:1
        };


        Person.createPasswordAccount(usersWalkup.user.id,passwordAccount)
        .then(function(res){
            return Person.createSecurityQuestions(usersWalkup.user.id,securityQuestions)
        })
        .then(function(res){
            return Person.update(usersWalkup.user.id,usersWalkup.user)
        })
        .then(function(res){
            console.log(res);
            usersWalkup.registering=false;
        })
        .catch(function(err){
            console.log(err);
            usersWalkup.registrationError=true;
            usersWalkup.registering=false;
        });
    };


}]);

})(angular);