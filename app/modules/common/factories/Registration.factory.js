angular.module('common')
.factory('Registration', (API, APIError, Base, $q) => {

    const self = {}
    const pub = {}

    // Helper functions to build out the person and request objects needed for registration
    const build = {
        person: function(registrationData) {
            const personData = Object.assign({}, registrationData.profile)

            personData.addresses[0].country = registrationData.userCountry.originalObject.code
            personData.language = Base.getLanguageCode()
            personData.timezone = 'EST5EDT'
            personData.organization = { id: registrationData.organization.id }

            if (personData.phones[0]) {
                personData.phones[0].type = 'main'
            }

            return personData
        },
        passwordAccount: function(registrationData) {
            return {
                version: '1',
                username: registrationData.login.username,
                password: registrationData.login.password,
                passwordPolicy: registrationData.organization.passwordPolicy,
                authenticationPolicy: registrationData.organization.authenticationPolicy
            }
        },
        securityQuestionAccount: function(registrationData) {
            return {
                version: '1',
                questions: [{
                    question: {
                        id: registrationData.login.question1.id,
                        type: 'question',
                        realm: registrationData.organization.realm
                    },
                    answer: registrationData.login.challengeAnswer1,
                    index: 1
                },
                {
                    question: {
                        id: registrationData.login.question2.id,
                        type: 'question',
                        realm: registrationData.organization.realm
                    },
                    answer: registrationData.login.challengeAnswer2,
                    index: 2
                }]
            }
        }, 
        walkupSubmit: function(registrationData) {
            const _registrationData = Object.assign({}, registrationData)

            return {
                person: this.person(_registrationData),
                passwordAccount: this.passwordAccount(_registrationData),
                securityQuestionAccount: this.securityQuestionAccount(_registrationData)
            }
        },
        servicePackageRequest: function(personId, personRealm, packageData) {
            let request = {
                registrant: {
                    id: personId,
                    type: 'person',
                    realm: personRealm
                },
                justification: 'User Walkup Registration'
            }

            if (packageData && packageData.selected) {
                request.packages = []
                angular.forEach(packageData.selected, function(servicePackage) {
                    // userWalkup.applications.selected is an array of strings that looks like
                    // ['<appId>,<appName>','<app2Id>,<app2Name>',etc]
                    request.packages.push({
                        id: servicePackage.split(',')[0],
                        type: 'servicePackage'
                    })
                })    
            }

            return request
        }
    }

    /**
     * this method makes sure to make the call but before it calls cui.initiateNonce
     * @param method method name
     * @param args method arguments
     * @returns {*} promise
     */
    self.makeNonceCall = ( method, ...args )=>{
        const deferred = $.Deferred()
        const tag = "registration/self/makeNonceCall"

        API.cui.initiateNonce()
        .then(res=>{

            API.cui[method].apply( API.cui, args )
            .then(result=>{
                deferred.resolve(result)
            })
            .fail((error)=>{
                deferred.reject(error)
            })

        })
        .fail((error)=>{
            console.error( tag, error )
            deferred.reject(error)
        })

        return deferred.promise()
    }

    /**
     * TODO: once the promise gets an error message, we are going to resolve as false. This is temporary.
     * Makes an api call to know if the registrating user's username or email address
     * appear already been taken.
     * @param stringParams a param array having either or both userName and emalAddress.
     * @returns {{promise, valid: (function(*=)), catch: (function(*))}}
     */
    self.isUsernameOrEmailTaken = stringParams => {
        const tag = "registration/self/isUsernameOrEmailTaken";

        return {
            promise:(() => {
                const defered = $q.defer()

                if( stringParams ){

                    self.makeNonceCall( "validateUsernameEmailNonce", {qs:stringParams} ).then( res => {
                        defered.resolve( true )
                    }).fail( error => {
                        defered.resolve( false )
                        console.error( tag + ".error", error )
                    })
                }else{
                    defered.resolve( true )
                }

                return defered.promise
            })(),
            valid: res => {
                return res
            },
            catch: error => {
                // do something with the error here
                console.error( tag + ".catch", "there is an error, :) ")
            }
        }
    }

    pub.getOrganizations=()=>{
        return self.makeNonceCall( "getOrganizationsNonce" )
    }

    pub.getSecurityQuestions=()=>{
        return self.makeNonceCall( "getSecurityQuestionsNonce" )
    }

    // Returns organizations and security questions for the realm.
    // Both must resolve for the walkup registration to work.
    pub.initWalkupRegistration = () => {    
        const defer = $q.defer()
        const data = {}
        
        APIError.offFor('RegistrationFactory.initWalkup')

        API.cui.initiateNonce()
        .then(() => {
            return API.cui.getOrganizationsNonce()
        })
        .then(res => {
            data.organizations = res
            return API.cui.getSecurityQuestionsNonce()
        })
        .then(res => {
            data.securityQuestions = res
            defer.resolve(data)
        })
        .fail(error => {
            APIError.onFor('RegistrationFactory.initWalkup')
            defer.reject(error)
        })

        return defer.promise
    }

    pub.walkupSubmit = (registrationData) => {
        const defer = $q.defer()
        const submitData = build.walkupSubmit(registrationData)

        API.cui.initiateNonce()
        .then(() => {
            return API.cui.postUserRegistrationNonce({data: submitData})
        })
        .then(res => {
            const packageRequestData = build.servicePackageRequest(res.person.id, res.person.realm, registrationData.applications)
            return API.cui.postPersonRequestNonce({data: packageRequestData})
        })
        .then(res => {
            defer.resolve(res)
        })
        .fail(error => {
            defer.reject(error)
        })

        return defer.promise
    }


    pub.selectOrganization = (organization)=>{
        const deferred = $.Deferred()
        const results = {
            grants: []
        }

        API.cui.initiateNonce()
        .then(res => {
            return API.cui.getOrgPackageGrantsNonce({organizationId: organization.id})
        })
        .then(res => {
            res.forEach(grant => {
                if (grant.servicePackageResource.requestable) results.grants.push(grant)
            })
            return API.cui.getPasswordPoliciesNonce({policyId: organization.passwordPolicy.id})
        })
        .then(res => {
            results.passwordRules = res.rules
            deferred.resolve(results)
        })
        .fail( error=>{
            deferred.reject(error)
        })

        return deferred.promise()
    }

    pub.getTaC = (packageId) => {
        return self.makeNonceCall("getOrgTacOfPackage",{packageId:packageId})
    }

    pub.isUsernameTaken = name => {
        return self.isUsernameOrEmailTaken( [['userName',name]] );
    }

    pub.isEmailTaken = email => {
        return self.isUsernameOrEmailTaken( [['emailAddress',email]] );
    }

    return pub

})
