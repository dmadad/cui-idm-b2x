angular.module('app')
.controller('orgDirectoryCtrl', ['$scope','$stateParams','API','$filter','Sort',
function($scope,$stateParams,API,$filter,Sort) {
    'use strict';

    var orgDirectory = this;
    var organizationId = $stateParams.id;

    orgDirectory.loading = true;
    orgDirectory.sortFlag = false;
    orgDirectory.userList = [];
    orgDirectory.unparsedUserList = [];
    orgDirectory.statusList = ['active', 'locked', 'pending', 'suspended', 'rejected', 'removed'];
    orgDirectory.statusCount = [0,0,0,0,0,0,0];

    // HELPER FUNCTIONS START ------------------------------------------------------------------------

    var handleError = function handleError(err) {
        orgDirectory.loading = false;
        $scope.$digest();
        console.log('Error', err);
    };

    var getStatusList = function(users) {
        var statusList = [];
        var statusCount = [orgDirectory.unparsedUserList.length];

        users.forEach(function(user) {
            if (user.status) {
                var statusInStatusList = _.some(statusList, function(status, i) {
                    if (angular.equals(status, user.status)) {
                        statusCount[i+1] ? statusCount[i+1]++ : statusCount[i+1] = 1;
                        return true;
                    }
                    return false;
                });

                if (!statusInStatusList) {
                    statusList.push(user.status);
                    statusCount[statusList.length] = 1;
                }
            }
        });
        orgDirectory.statusCount = statusCount;
        return statusList;
    };

    var onLoadFinish = function onLoadFinish(organizationResponse) {
        orgDirectory.organization = organizationResponse;
        API.cui.getOrganizations()
        .then(function(res) {
            orgDirectory.organizationList = res;
            return API.cui.getPersons({'qs': [['organization.id', orgDirectory.organization.id]]});
        })
        .then(function(res) {
            orgDirectory.userList = res;
            orgDirectory.unparsedUserList = res;
            orgDirectory.statusList = getStatusList(orgDirectory.userList);
            orgDirectory.loading = false;
            $scope.$digest();
        })
        .fail(handleError);
    };

    // HELPER FUNCTIONS END --------------------------------------------------------------------------

    // ON LOAD START ---------------------------------------------------------------------------------

    if (!organizationId) {
        // If no id parameter is passed load directory of logged in user's organization.
        API.cui.getPerson({personId: API.getUser(), useCuid:true})
        .then(function(person) {
            return API.cui.getOrganization({ organizationId: person.organization.id });
        })
        .then(function(res) {
            onLoadFinish(res);
        })
        .fail(handleError);
    }
    else {
        // Load organization directory of id parameter
        API.cui.getOrganization({ organizationId: organizationId })
        .then(function(res) {
            onLoadFinish(res);
        })
        .fail(handleError);
    }

    // ON LOAD END -----------------------------------------------------------------------------------

    // ON CLICK START --------------------------------------------------------------------------------

    orgDirectory.getOrgMembers = function getOrgMembers(organizationId, organizationName) {
        orgDirectory.loading = true;
        orgDirectory.organization.id = organizationId;
        orgDirectory.organization.name = organizationName;
        API.cui.getPersons({'qs': [['organization.id', orgDirectory.organization.id]]})
        .then(function(res) {
            orgDirectory.userList = res;
            orgDirectory.unparsedUserList = res;
            orgDirectory.statusList = getStatusList(orgDirectory.userList);
            orgDirectory.loading = false;
            $scope.$digest();
        })
        .fail(handleError);
    };

    orgDirectory.sort = function(sortType) {
        Sort.listSort(orgDirectory.userList, sortType, orgDirectory.sortFlag);
        orgDirectory.sortFlag =! orgDirectory.sortFlag;
    };

    orgDirectory.parseUsersByStatus = function(status) {
        if (status === 'all') {
            orgDirectory.userList = orgDirectory.unparsedUserList;
        }
        else {
            var filteredUsers = _.filter(orgDirectory.unparsedUserList, function(user) {
                return user.status === status;
            });
            orgDirectory.userList = filteredUsers;
        }
    };

    // ON CLICK END ----------------------------------------------------------------------------------

}]);