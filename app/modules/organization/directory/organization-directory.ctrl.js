angular.module('organization')
.controller('orgDirectoryCtrl',function($scope,$stateParams,API,$filter,Sort,$state,$q) {
    'use strict';

    const orgDirectory = this,
        organizationId = $stateParams.orgID;

    orgDirectory.organization = {};
    orgDirectory.loading = true;
    orgDirectory.sortFlag = false;
    orgDirectory.userList = [];
    orgDirectory.unparsedUserList = [];
    orgDirectory.statusList = ['active', 'locked', 'pending', 'suspended', 'rejected', 'removed'];
    orgDirectory.statusCount = [0,0,0,0,0,0,0];

    // HELPER FUNCTIONS START ------------------------------------------------------------------------

    const handleError = function handleError(err) {
        orgDirectory.loading = false;
        $scope.$digest();
        console.log('Error', err);
    };

    const getStatusList = function(users) {
        let statusList = [];
        let statusCount = [orgDirectory.unparsedUserList.length];

        users.forEach(function(user) {
            if (user.status) {
                let statusInStatusList = _.some(statusList, function(status, i) {
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

    const flattenHierarchy = (orgChildrenArray) => {
        if (orgChildrenArray) {
            let childrenArray = orgChildrenArray;
            let orgList = [];

            childrenArray.forEach(function(childOrg) {
                if (childOrg.children) {
                    let newChildArray = childOrg.children;
                    delete childOrg['children'];
                    orgList.push(childOrg);
                    orgList.push(flattenHierarchy(newChildArray));
                }
                else {
                    orgList.push(childOrg);
                }
            });
            return _.flatten(orgList);
        }
    };

    const getPeopleAndCount = () => {
        const getPersonOptions = {
            'qs': [
                ['organization.id', String(orgDirectory.organization.id)],
                ['pageSize', String(orgDirectory.paginationPageSize)],
                ['page',String(1)]
            ]
        }

        const countPersonOptions = {
            'qs': ['organization.id', String(orgDirectory.organization.id)]
        }

        $q.all([API.cui.getPersons(getPersonOptions), API.cui.countPersons(countPersonOptions)])
        .then(res => {

            orgDirectory.unparsedUserList = orgDirectory.userList = angular.copy(res[0])
            orgDirectory.statusList = getStatusList(orgDirectory.userList)

            orgDirectory.orgPersonCount = res[1]
            orgDirectory.loading = false

            orgDirectory.reRenderPagination && orgDirectory.reRenderPagination()

        })
    }

    const onLoadFinish = (organizationResponse) => {
        API.cui.getOrganizationHierarchy({organizationId: organizationResponse.id})
        .then(res => {
            orgDirectory.organization = res
            orgDirectory.organizationList = flattenHierarchy(res.children)

            getPeopleAndCount()
        })
        .fail(handleError)
    }

    // HELPER FUNCTIONS END --------------------------------------------------------------------------

    // ON LOAD START ---------------------------------------------------------------------------------

    if (organizationId) {
        // Load organization directory of id parameter
        API.cui.getOrganization({organizationId: organizationId})
        .then(function(res) {
            onLoadFinish(res);
        })
        .fail(handleError);
    }
    else {
        // If no id parameter is passed load directory of logged in user's organization.
        API.cui.getPerson({personId: API.getUser(), useCuid:true})
        .then(function(res) {
            return API.cui.getOrganization({organizationId: res.organization.id});
        })
        .then(function(res) {
            onLoadFinish(res);
        })
        .fail(handleError);
    }

    // ON LOAD END -----------------------------------------------------------------------------------

    // ON CLICK START --------------------------------------------------------------------------------

    orgDirectory.getOrgMembers = (organization) => {
        orgDirectory.loading = true;
        orgDirectory.organization = organization;
        API.cui.getPersons({'qs': [['organization.id', String(orgDirectory.organization.id)]]})
        .then(function(res) {
            orgDirectory.userList = res;
            orgDirectory.unparsedUserList = res;
            orgDirectory.statusList = getStatusList(orgDirectory.userList);
            return API.cui.countPersons({'qs': ['organization.id', String(orgDirectory.organization.id)]});
        })
        .then(function(res) {
            orgDirectory.orgPersonCount = res;
            orgDirectory.loading = false;
            $scope.$digest();
        })
        .fail(handleError);
    };

    orgDirectory.sort = function sort(sortType) {
        Sort.listSort(orgDirectory.userList, sortType, orgDirectory.sortFlag);
        orgDirectory.sortFlag =! orgDirectory.sortFlag;
    };

    orgDirectory.parseUsersByStatus = function parseUsersByStatus(status) {
        if (status === 'all') {
            orgDirectory.userList = orgDirectory.unparsedUserList;
        }
        else {
            let filteredUsers = _.filter(orgDirectory.unparsedUserList, function(user) {
                return user.status === status;
            });
            orgDirectory.userList = filteredUsers;
        }
    };

    orgDirectory.paginationHandler = function paginationHandler(page) {
        API.cui.getPersons({'qs': [['organization.id', String(orgDirectory.organization.id)],
                                    ['pageSize', String(orgDirectory.paginationPageSize)], ['page', String(page)]]})
        .then(function(res) {
            orgDirectory.userList = res;
            orgDirectory.unparsedUserList = res;
            orgDirectory.statusList = getStatusList(orgDirectory.userList);
        })
        .fail(handleError);
    };

    // ON CLICK END ----------------------------------------------------------------------------------

    // WATCHERS START --------------------------------------------------------------------------------

    $scope.$watch('orgDirectory.paginationPageSize', function(newValue, oldValue) {
        if (newValue && oldValue && newValue !== oldValue) {
            API.cui.getPersons({'qs': [['organization.id', String(orgDirectory.organization.id)],
                                ['pageSize', String(orgDirectory.paginationPageSize)], ['page', 1]]})
            .then(function(res) {
                orgDirectory.userList = res;
                orgDirectory.unparsedUserList = res;
                orgDirectory.paginationCurrentPage = 1;
                orgDirectory.statusList = getStatusList(orgDirectory.userList);
            })
            .fail(handleError);
        }
    });

    // WATCHERS END ----------------------------------------------------------------------------------

    // ON CLICK START --------------------------------------------------------------------------------

    orgDirectory.userClick = (clickedUser) => {
        switch (clickedUser.status) {
            case 'active':
            case 'unactivated':
            case 'inactive':
                $state.go('organization.directory.userDetails', {userID: clickedUser.id, orgID: organizationId});
                break;
            case 'pending':
                $state.go('organization.requests.personRequest', {userID: clickedUser.id, orgID: organizationId});
                break;
        }
    };

    // ON CLICK END ----------------------------------------------------------------------------------

});
