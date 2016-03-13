angular.module('app')
.controller('myApplicationsCtrl',['API','$scope','$state',
function(API,$scope,$state){
    var myApplications = this;

    myApplications.list=[];

    var handleError=function(err){
        console.log('Error \n\n', err);
    };

    // ON LOAD START ------------------------------------------------------------------------------------------

                // WORKAROUND CASE #1
    var getApplicationsFromGrants=function(grants){ // from the list of grants, get the list of services from each of those service packages
        var i=0;
        if(grants.length===0){
            // User has no packages granted
            myApplications.doneLoading=true;
            $scope.$digest();
        }
        grants.forEach(function(grant){
            API.cui.getPackageServices({'packageId':grant.servicePackage.id})
            .then(function(res){
                i++;
                res.forEach(function(service){
                    service.status=grant.status; // attach the status of the service package to the service
                    service.parentPackage=grant.servicePackage.id;
                    myApplications.list.push(service);
                });
                if(i===grants.length){ // if this is the last grant
                    myApplications.doneLoading=true;
                    $scope.$digest();
                }
            })
            .fail(handleError);
        });
    };


   API.cui.getPersonPackages({ personId: API.getUser(), useCuid:true }) // this returns a list of grants
    .then(function(res){
        getApplicationsFromGrants(res);
    })
    .fail(handleError);


    // ON LOAD END --------------------------------------------------------------------------------------------------

    // ON CLICK FUNCTIONS START -------------------------------------------------------------------------------------

    myApplications.goToDetails=function(application){
        $state.go('applications.myApplicationDetails' , { 'packageId':application.parentPackage, 'appId':application.id } );
    };


    // ON CLICK FUNCTIONS END ---------------------------------------------------------------------------------------

}]);