(function ($) {

    /*
    * deui  1.0
    * Copyright (c) 2015 Digital Example
    * Date: 2015-06-05
    */

    /** The root class for the DE UI framework
    @name deui
    @class This is the root class for the DE jQuery UI framework
    */
    $.deui = $.deui || {};

    // Extend the deui class/namespace
    $.extend($.deui, {

        /** @scope deui */
        /**
		The properties for the deui		
		*/
        properties: {
            isInited: false
        },

        common: {
            
            login: {
                isUserLoggedIn: false,
                accessToken: null,
                userInfo: null,
                externalProviders: []
            },
            settings: {
                system: {},
                user: {}
            },
            dataCache: [],
            templateCache: {
                "login": { url: '/scripts/app/de/deui.login.html', data: '', isLoaded: false },
                "error": { url: '/scripts/app/de/deui.error.html', data: '', isLoaded: false }
            },
            menu: {
                menuItems: [],
                subMenuItems: [],
                currentMenu: null
            }
        },
        isUserInRole: function (roleId) {
            var foundRole = false;
            if ($.deui.common.login.isUserLoggedIn && $.deui.common.login.userInfo.roles) {
                $.each($.deui.common.login.userInfo.roles, function (index, value) {
                    if (value.roleId == roleId) {
                        foundRole = true;
                        return false;
                    }
                })
            } 

            return foundRole;
           
        },

        isUserInRoleName: function (roleName) {
            var foundRole = false;
            if ($.deui.common.login.isUserLoggedIn && $.deui.common.login.userInfo.roles) {
                roleName = roleName.toLowerCase();
                $.each($.deui.common.login.userInfo.roles, function (index, value) {
                    if (value.roleName.toLowerCase() == roleName) {
                        foundRole = true;
                        return false;
                    }
                })
            }

            return foundRole;

        },
        appInit: function () {
            var deferred = $.Deferred();

            //$.logToConsole("$.deui.appInit()");

            try {
                //added by Andy so we only Init Once   05/29/2015
                if ($.deui.properties.isInited === false) {
                    $.when(
                        $.deui.refreshTemplateCache(),
                        //After Initialization we want to auto login the user if possible
                        $.deui.autoLogin(),
                        
                        //$.deui.getSystemSettings(),
                        //is the GoogleLoginAPi Loaded if so lets init it
                        //$.deui.initExternalProviders()

                    ).done(function (x, data) {
                        //$.logToConsole("$.deui.appInit() DONE");

                        $.when(
                            $.deui.getMenuItems(),    
                            $.deui.loadPageContent()
                        ).done(function (x, data) {
                            $.deui.properties.isInited = true;
                            
                            deferred.resolve();
                        }).fail(function (result) {
                            deferred.reject(result);
                        })
                            .fail(function (result) {
                                deferred.reject(result);
                            });
                    });
                } else {
                    deferred.resolve();
                }
            } catch (ex) {
                $.logToConsole('Fatal Error $.deui.appinit: ' + ex.message)
                var objError = $.deui.createErrorFromScriptException(ex);
                deferred.reject(objError);
            }
            return deferred.promise();
        },

        refreshTemplateCache: function () {
            var deferred = $.Deferred();
            var promiseArray = [];
            for (var myTemplateKey in $.deui.common.templateCache) {
                var myTemplate = $.deui.common.templateCache[myTemplateKey];
                promiseArray.push($.deui.getTemplateCache(myTemplateKey, true));
            }
            $.when(promiseArray).then(
                function () {
                    deferred.resolve()
                },
                function () {
                    deferred.resolve()
                }
             )
            return deferred.promise();
        },

        getSystemSettings: function () {
            var deferred = $.Deferred();
            $.deui.ajax({
                method: 'GET',
                url: 'detools/api/Settings/AnonymousClientSideSettings'
            }).then(
                function (results) {
                    $.deui.common.settings.system = results;
                    deferred.resolve();
                },
                function (reason) {
                    $.logToConsole("Error: deui.getSystemSettings failed " + reason);
                    deferred.reject(reason);
                }
            );
            return deferred.promise();
        },

        getUserSettings: function (options) {
            var deferred = $.Deferred();
            $.deui.ajax($.extend({
                method: 'GET',
                url: 'detools/api/Settings/UserClientSideSettings'
            }, options)).then(
                function (results) {
                    //$.deui.common.settings.user = results;
                    deferred.resolve(results);
                },
                function (reason) {
                    $.logToConsole("Error: deui.getUserSettings failed " + reason);
                    deferred.reject(reason);
                }
            );
            return deferred.promise();
        },

        loadPageContent: function () {

            const parsedUrl = new URL(window.location.href);
            let pageOptions = null;
            if (parsedUrl.pathname === '/') {
                pageOptions = {
                    pageContentGuid: '00000000-0000-0000-0000-000000000001'
                }; //Home Page                     
            } else {
                pageOptions = {
                    linkUrl: parsedUrl.pathname
                };
            }
            //$.deui.showLoading();
            $.deui.getPageContent(pageOptions).then(function (page) {
                $.deui.showPageContent(page);
                //$.deui.hideLoading();
            }
                
            )
        },

        showPageContent: function (page) {
            document.title = page.pageTitle;
            $('meta[name="description"]').attr("content", page.pageDescription);
            $(".pageContent").html(page.content);
        },

        menuItemClick: function (e) {
            let $menuItem = $(e.currentTarget);            
            let pageContentGuid = $menuItem.attr("data-id");
            $.deui.getPageContent({ pageContentGuid: pageContentGuid }).then(
                function (page) {
                    history.pushState({ page: page }, page.pageTitle, page.linkUrl);
                    $.deui.showPageContent(page);

                }
            );
        },


        getPageContent: function (options) {
            var deferred = $.Deferred();
            var url = '';
            if (options.pageContentGuid) {
                url = '/detools/api/PageContent/PageContentGuid/' + options.pageContentGuid;
            }else if (options.linkUrl) {
                url = '/detools/api/PageContent/LinkUrl/' + options.linkUrl;
            }
            else {
                url = '/detools/api/PageContent/PageContentGuid/00000000-0000-0000-0000-000000000001' ; //Home Page
            }
            $.deui.ajax({
                method: 'GET',
                url:  url
            }).then(
                function (page) {
                    deferred.resolve(page);
                },
                function (reason) {
                    $.logToConsole("Error: deui.getPageContent failed " + reason);
                    deferred.reject();
                }
            );
            return deferred.promise();
        },

        getMenuItems: function () {
            var deferred = $.Deferred();
            $.deui.ajax({
                method: 'GET',
                url: '/detools/api/PageContent/MenuItems'
            }).then(
                function (menuItems) {
                    $.deui.common.menu.menuItems = menuItems;
                    let $menuItemTemplate = $(".menuItemTemplate").find(".menuItem");
                    let $menuItemsContainer = $(".menuItems");
                    $menuItemsContainer.empty();
                    $.each(menuItems, function (index, item) {
                        let $menuItem = $menuItemTemplate.clone();
                        //$menuItem.find("a").attr("href", item.linkUrl + "?lt=" + item.linkText).attr("target", item.linkTarget).text(item.linkText);
                        if (item.linkUrl.startsWith("https://") || item.linkUrl.startsWith("https://")) {
                            $menuItem.find("a").attr("href", item.linkUrl).attr("data-id", item.pageContentGuid).text(item.linkText);    
                            if (item.linkTarget) {
                                $menuItem.find("a").attr("target", item.linkTarget);
                            }
                        }else if (item.linkTarget === "site") {
                            $menuItem.find("a").attr("href", item.linkUrl).attr("data-id", item.pageContentGuid).text(item.linkText);
                        } else {
                            $menuItem.find("a").attr("href", "javascript:void(0)").attr("data-id", item.pageContentGuid).text(item.linkText).on("click", $.deui.menuItemClick);
                        }
                        $menuItemsContainer.append($menuItem);
                    });
                    deferred.resolve();
                },
                function (reason) {
                    $.logToConsole("Error: deui.getMenuItems failed " + reason);
                    deferred.reject();
                }
            );
            return deferred.promise();
        },

        getTemplateCache: function (templateName, forceLoadFromServer) {
            var deferred = $.Deferred()
            var myTemplate = $.deui.common.templateCache[templateName];
            if (myTemplate.isLoaded == true && forceLoadFromServer == false) {
                deferred.resolve(myTemplate.data);
            } else {

                $.ajax({
                    url: myTemplate.url,
                    data: {},
                    success: function (data, textStatus, jqXHR) {
                        myTemplate.data = data;
                        myTemplate.isLoaded = true;
                        $.logToConsole('Refreshed Template Cache $.deui.getTemplateCache ' + templateName + ' : ' + myTemplate.url);
                        deferred.resolve(myTemplate.data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $.logToConsole('Error fetching Template Cache $.deui.getTemplateCache ' + templateName + ' : ' + myTemplate.url + ' ' + textStatus + ' ' + errorThrown);
                        deferred.reject(jqXHR, textStatus, errorThrown);
                    }
                });
            }
            return deferred.promise();
        },
        

        getSetting: function (settingName, settingGroup) {

            //Loop the user settings and look for the setting you want
            // if not a user setting then check system settings
            if (settingGroup === undefined) {
                settingGroup = "deui";
            }
            var retval = $.deui.getUserSetting(settingName, SettingGroup);

            if (retval == undefined) {
                retval = $.deui.getSystemSetting(settingName, SettingGroup);
            } else {
                if (settingGroup != "deui" && settingName != 'clientSideDebug') {
                    $.logToConsole("CRITICAL ERROR: getSetting() retval = undefined")
                }
            }

            return retval;
        },

       
        //returns a SystemSetting Object if the setting is changed it will change globally
        getSystemSetting: function (settingName, settingGroup) {

            if (settingGroup === undefined) {
                settingGroup="deui"
            }
            //Loop the settings and look for the setting you want
            if (this.common.settings.system && this.common.settings.system[settingGroup]) {
                return this.common.settings.system[settingGroup][settingName];
            } else {
                if (settingGroup != "deui" && settingName != 'clientSideDebug') {
                    $.logToConsole("CRITICAL ERROR: getSystemSetting - this.common.settings.system = undefined");
                }
            }

            return undefined;
        },

        //returns a UserSetting Object if the setting is changed it will change globally
        getUserSetting: function (settingName, settingGroup) {
            if (settingGroup === undefined) {
                settingGroup = "deui";
            }
            //Loop the settings and look for the setting you want
            if (this.common.settings.user && this.common.settings.user[settingGroup]) {
                return this.common.settings.user[settingGroup][settingName];
            } else {
                if (settingGroup != "deui" && settingName != 'clientSideDebug') {
                    $.logToConsole("CRITICAL ERROR: getSystemSetting - this.common.settings.system = undefined");
                }
            }
            return undefined;
        },

        clone: function clone(obj) {
            var outpurArr = new Array();

            for (var i in obj) {
                outpurArr[i] = typeof (obj[i]) === 'object' ? this.clone(obj[i]) : obj[i];
            }

            return outpurArr;
        },

        stringToBoolean: function (string) {
            switch (string.toLowerCase()) {
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": case null: return false;
                default: return Boolean(string);
            }
        },

        showLoading: function () {
            if ($('#divContent').length > 0)
                $('#divContent').showLoading({ marginTop: 40 });
            else
                $('body').showLoading();
        },

        hideLoading: function () {
            if ($('#divContent').length > 0)
                $('#divContent').hideLoading({ marginTop: 40 });
            else
                $('body').hideLoading();
        },

       

        /* This function will remove reserved jQuery chars from a string 

        Currently it removes    #;&,.+*~':"!^$[]()=>|/%{}
        */
        cleanForjQuery: function (stringToClean) {

            //If this is a string
            if (stringToClean.replace) {
                var newString = stringToClean.replace(/\#/g, '').replace(/\;/g, '').replace(/\&/g, '');
                newString = newString.replace(/\,/g, '').replace(/\./g, '').replace(/\+/g, '');
                newString = newString.replace(/\*/g, '').replace(/\~/g, '').replace(/\'/g, '');
                newString = newString.replace(/\:/g, '').replace(/\"/g, '').replace(/\!/g, '');
                newString = newString.replace(/\^/g, '').replace(/\$/g, '').replace(/\[/g, '');
                newString = newString.replace(/\]/g, '').replace(/\(/g, '').replace(/\)/g, '');
                newString = newString.replace(/\=/g, '').replace(/\>/g, '').replace(/\|/g, '');
                //newString = newString.replace(/\//g, '');
                newString = newString.replace(/\%/g, '');
                newString = newString.replace(/\}/g, '').replace(/\{/g, '');

                return newString;
            }
            else {
                return stringToClean;
            }

        },

        /* This function will escape reserved JSON chars from a JSON object 

        Currently it escapes a single quote, double quote, a forward slash and a backslash with a backslash
        */
        escapeJSON: function (stringToClean) {
            try {
                var newString;

                if (stringToClean.replace) {
                    newString = stringToClean.replace(/\'/g, '').replace(/\"/g, '');
                    //.replace(/\//g, '\\');
                } else {
                    newString = stringToClean;
                }

                return newString;
            }
            catch (ex) {
                if (jQuery.pwui.pwuiDebug()) { console.log("pwui.escapeJSON: " + ex + "  String: " + stringToClean); }
            }
        },

        /* 
        Will return a boolean specifying whether a variable is a string or not
        */
        isString: function (a) {
            return typeof a === 'string';
        },

        /* Generate a guid / uuid  --  682db637-0f31-4847-9cdf-25ba9613a75c
        */
        uuid: function uuid() {
            var chars = '0123456789abcdef'.split('');

            var uuid = [], rnd = Math.random, r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4'; // version 4

            for (var i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | rnd() * 16;

                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
                }
            }

            return uuid.join('');
        },
        showLoading: function () {
            if ($('#divContent').length > 0)
                $('#divContent').showLoading({ marginTop: 40 });
            else
                $('body').showLoading();
        },

        hideLoading: function () {
            if ($('#divContent').length > 0)
                $('#divContent').hideLoading({ marginTop: 40 });
            else
                $('body').hideLoading();
        },
       

        /** This is the friendly error we will push out there */
        friendlyError: 'An Error Has Occurred, Please Try Again',

        // Begin Auth ---------------------------------------------------
        authGlobal : {
            loginDialog: { isLoginDialogOpen: false, queuedLoginDialogRequests: [] },
            getNewAccessToken: { isPending: false, queuedRequests: [] }

        },

        displayError: function (objError) {
            return $.deui.showErrorDialog({ error: objError });
        },
        getErrorAccessIsDenied: function (debug) {
            return $.deui.createError("Access is denied", debug, "Client Error", "Access is denied", 402);
        },
        handleScriptException: function (ex, exceptionMessage) {
            var objError = $.deui.createErrorFromScriptException(ex, exceptionMessage);
            return $.deui.displayError(objError);
        },
        showLoginDialog: function (options) {
            // returns a promise which on success mean login on failure means user cancaled out of login
            var myDefer = jQuery.Deferred();
            //$.deui.loginDialogGlobal =  {isLoginDialogOpen: false, queuedLoginDialogRequests: []};
            if ($.deui.authGlobal.loginDialog.isLoginDialogOpen == true) {
                $.logToConsole("$.deui.showLoginDialog Dialog Already Open Queueing Promise");
                $.deui.authGlobal.loginDialog.queuedLoginDialogRequests.push(myDefer);
            } else {
                $.deui.authGlobal.loginDialog.isLoginDialogOpen = true;
                var trigger = "cancel";

                var defaultOptions = {
                    dialogOptions: {
                        modal: true,
                        title: "Please Log In",
                        width: 640,
                        beforeClose: beforeClose,
                        showExternalLogins: true,
                        appendTo: "body",
                        closeText: ""
                    },
                    loginData: {
                        userName: '',
                        password: '',
                        rememberMe: false
                    }
                }
                var myOptions = $.extend(defaultOptions, options);
                var loginData = myOptions.loginData;
                var $dialogElement;
                var $dialogContent;

                var beforeClose = function (event, ui) {
                    console.log("BEFORE CLOSE - ", trigger);
                    $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;
                    if (trigger == 'cancel') {
                        cancelLogin();
                    }
                    return true;
                };
                var showLoading = function () {
                    $dialogElement.find('.dialogContent').hide();
                    $dialogElement.find('.dialogLoading').show();
                };
                var hideLoading = function () {
                    $dialogElement.find('.dialogContent').show();
                    $dialogElement.find('.dialogLoading').hide();
                };
                var attemptLogin = function () {
                    var validationErrors = "";

                    trigger = "login"
                    $('#deui_login_error').hide();

                    showLoading();
                    //$dialogElement.dialog('close');
                    loginData.userName = $('#deui_login_username').val();
                    loginData.password = $('#deui_login_password').val();
                    loginData.rememberMe = true; //$('#deui_login_rememberMe').is(':checked');

                    if (!loginData.userName) {
                        validationErrors += '<p>User Name can not be blank.</p>';
                    }
                    if (!loginData.password) {
                        validationErrors += '<p>Password can not be blank.</p>';
                    }
                    if (validationErrors) {
                        hideLoading();
                        $('#deui_login_errormsg').html(validationErrors);
                        $('#deui_login_error').show();
                        return;
                    }

                    $.deui.login({ grant_type: "password", username: loginData.userName, password: loginData.password, rememberMe: loginData.rememberMe }).then(
                        function (aiTokens, userInfo) {
                            //All of the $.deui.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            hideLoading();
                            $dialogElement.dialog('destroy');
                            myDefer.resolve(userInfo);
                            while ($.deui.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                                var myQueueDefered = $.deui.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                                myQueueDefered.resolve(userInfo);
                            }
                            $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;
                        },
                        function (reason) {
                            console.log('Error: deui.showLoginDialog() SERVER RETURNED', reason);
                            hideLoading();
                            $('#deui_login_errormsg').html(reason);
                            $('#deui_login_error').show();
                            trigger = "cancel";
                            $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;
                            //$dialogElement.dialog('open');
                        }
                    )
                }
                var cancelLogin = function () {
                    trigger = "cancelclick";
                    $.logToConsole("Login Dialog Cancel Button Clicked");

                    $dialogElement.dialog('destroy');
                    var rejectReason = "User Canceled Login Dialog";
                    myDefer.reject(rejectReason);
                    while ($.deui.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                        var myQueueDefered = $.deui.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                        myQueueDefered.reject(rejectReason);
                    }
                    $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;

                }
                var setDialogValues = function () {
                    //trigger = "cancel"
                    if (loginData) {
                        $('#deui_login_username').val(loginData.username || '');
                        $('#deui_login_password').val(loginData.password || '');
                        $('#deui_login_rememberMe').prop('checked', (loginData.rememberMe || false));
                    }

                }


                var getExternalLoginHtml = function () {
                    var html = '';
                    if ($.deui.common.login.externalProviders) {
                        html = '<div style="height:100%;border-left:1px solid #C0C0C0;padding:15px;">';


                        for (var key in $.deui.common.login.externalProviders) {
                            var externalLogin = $.deui.common.login.externalProviders[key];

                            html = html + '<div data-provider="' + externalLogin.name.toLowerCase() + '" class="btn btn-block btn-social btn-' + externalLogin.name.toLowerCase() + '"><i class="fa ' + $.deui.getFontAwesomeClassForLoginProvider(externalLogin.name) + '"></i> Sign in ' + externalLogin.name + ' </div>';

                        };
                        html = html + '</div>';
                    }
                    return html;
                };
                // Get markup for login and show it as a dialog
                $.deui.getTemplateCache('login').then(
                    function (html) {
                        $dialogElement = $('<div id="deui_login_dialog"></div>');
                        $dialogElement.html(html);
                        $dialogElement.find('#deui_login_btnLogin')
                            .on('click', attemptLogin)
                            .end();
                        $dialogElement.find('#deui_login_btnCancel')
                            .on('click', cancelLogin)
                            .end();
                        $dialogElement.find('input')
                            .on('keypress', function (event) {
                                if (event.which === 13) {
                                    attemptLogin();
                                }
                            })
                            .end();
                        var $deuiLoginExternal = $dialogElement.find('#deuiLoginExternal');
                        $deuiLoginExternal.html(getExternalLoginHtml());

                        //wire up the External Clicks to do the Logins
                        $deuiLoginExternal.find(".btn-social").on('click', function (e) {
                            var providerName = $(e.currentTarget).attr('data-provider');
                            var provider = $.deui.common.login.externalProviders[providerName];
                            if (!provider) {
                                return;
                            }
                            $.deui.externalLogin(provider).then(
                                function (result) {
                                    if (result.redirect == true) {
                                        //set the state in session so on the redirect back we can make sure it came from us
                                        sessionStorage["loginredir"] = window.location.href;
                                        window.location.href = result.redirectUrl;

                                    } else {
                                        //we will only get here on the non redirected logins like facebook and google, the OpenIDs do redirects
                                        // which are handled above as they will redirect back here with externalLogin=true set on the search
                                        //if the result.registered == true then this account is already registered so do the login
                                        // if registerd == false then we need to redirect to the user registration page
                                        if (result.registered === true) {
                                            showLoading();
                                            $.deui.login({ grant_type: "externalbearer", token: result.access_token }).then(
                                                function (userInfo) {
                                                    hideLoading();
                                                    $dialogElement.dialog('destroy');
                                                    myDefer.resolve(userInfo);
                                                    while ($.deui.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                                                        var myQueueDefered = $.deui.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                                                        myQueueDefered.resolve(userInfo);
                                                    }
                                                    $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;
                                                },
                                                function (reason) {
                                                    console.log('Error: deui.showLoginDialog() SERVER RETURNED', reason);
                                                    hideLoading();
                                                    $('#deui_login_errormsg').html(reason);
                                                    $('#deui_login_error').show();
                                                    trigger = "cancel";
                                                    $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;
                                                }
                                            )
                                        } else {
                                            //send them to the registration page and add the accesstoken to the search path

                                            window.location.href('/deui/user/register?externalLogin=true&access_token=' + encodeURIComponent(result.access_token) + '&redir=' + encodeURIComponent(window.location.href));

                                        }
                                    }
                                },
                                function (result) {
                                    console.log('Error: deui.showLoginDialog() SERVER RETURNED', reason);
                                    hideLoading();

                                    $.deui.authGlobal.loginDialog.isLoginDialogOpen = false;
                                    if (result.errors) {
                                        var htmlErrors = 'Errors:<br/>';
                                        for (var key in result.errors) {
                                            htmlErrors = htmlErrors + result.errors[key] + '<br/>';
                                        };
                                        $('#deui_login_errormsg').html(htmlErrors);
                                    } else {

                                        $('#deui_login_errormsg').html(result.Message);
                                    }

                                    $('#deui_login_error').show();
                                    trigger = "cancel";


                                });
                        });
                        $deuiLoginExternal.toggle(myOptions.dialogOptions.showExternalLogins);

                        $dialogElement.dialog(myOptions.dialogOptions);
                        setDialogValues();
                        GLOBALS = $('#deui_login_dialog');
                        $dialogContent = $('#deui_login_dialog');
                    },
                    function () {
                        $.logToConsole("Error loading Login Dialog HTML");
                    }
                );
            } // end if $.deui.loginDialogGlobal.isLoginDialogOpen
            return myDefer.promise();
        },

        getFontAwesomeClassForLoginProvider: function (providerName) {
            var socialname = providerName.toLowerCase();
            switch (socialname) {
                case 'microsoft':
                    socialname = 'windows';
                    break;
            }
            return 'fa-' + socialname;
        },

        showErrorDialog: function (options) {
            //console.log('auth.js showErrorDialog()');
            //returns a promise which on success mean login on failur means user cancaled out of login
            var myDefer = jQuery.Deferred();
            var trigger = "cancel";
            var beforeClose = function (event, ui) {
                if (trigger === 'cancel') {
                    onCancelClick();
                }
                return true;
            }
            var defaultOptions = {
                dialogOptions: {
                    autoOpen: false,
                    modal: true,
                    title: "Error",
                    width: 500,
                    beforeClose: beforeClose,
                    appendTo: ".deui-body",
                    closeText: ""
                },
                error: undefined,
                showRetry: true,
                showCancel: true
            }
            var myOptions = $.extend(defaultOptions, options);

            if (options.error == undefined || options.error == null) {
                options.error = $.deui.createErrorFromScriptException("Default Error Handler Error", "Default Error Handler Error");
            }

            var $dialogElement = $('#deui_error_dialog');

            var onRetryClick = function () {
                trigger = "retry"
                $('#deui_error_dialog_error').hide();
                $.logToConsole("Error Dialog Retry Button Clicked");
                $dialogElement.dialog("close");
                myDefer.resolve("Retry");
            }
            var onCancelClick = function () {
                trigger = "cancelclick";
                $.logToConsole("Error Dialog Cancel Button Clicked");
                if (myOptions.showCancel == false) {
                    myDefer.resolve("User Canceled Error Dialog");
                } else {
                    myDefer.reject("User Canceled Error Dialog");
                }

                $dialogElement.dialog("close");
            }
            var onOkClick = function () {
                trigger = "okclick";
                $.logToConsole("Error Dialog Ok Button Clicked");
                if (myOptions.showCancel == false) {
                    myDefer.resolve("User Ok Error Dialog");
                } else {
                    myDefer.reject("User Ok Error Dialog");
                }

                $dialogElement.dialog("close");
            }

            var setDialogValues = function () {
                trigger = "cancel";
                $("#deui_error_dialog_errorMessageDetails_displayedErrorMessage").text(myOptions.error.message);
                $("#deui_error_dialog_errorMessageDetails_ExceptionType").text(myOptions.error.exceptionType);
                $("#deui_error_dialog_errorMessageDetails_ExceptionMessage").text(myOptions.error.exceptionMessage);
                var stacktrace = myOptions.error.stackTrace;

                //TODO: This approach for displaying the stack trace is a problem waiting to happen if the stack trace contains markup
                //      we should leave the newlines alone and put the stacktrace inside a <pre> using jquery's .text()
                //
                //if (typeof stacktrace === 'string') {
                //    stacktrace = stacktrace.replace(/\n/gi, '<br/>');
                //}
                //$("#deui_error_dialog_errorMessageDetails_StackTrace").html(stacktrace);                
                $("#deui_error_dialog_errorMessageDetails_StackTrace").text(stacktrace);
                $('#deui_error_dialog_messageContent_Default').hide();
                $('#deui_error_dialog_messageContent_NoInternet').hide();
                $('#deui_error_dialog_messageContent_AccessDenied').hide();
                $('#deui_error_dialog_messageContent_NotFound').hide();
                switch (myOptions.error.StatusCode) {
                    case 0:
                        $('#deui_error_dialog_messageContent_NoInternet').show();
                        break;
                    case 402:
                        $('#deui_error_dialog_messageContent_AccessDenied').show();
                        break;
                    case 404:
                        $('#deui_error_dialog_messageContent_NotFound').show();
                        break;
                    default:
                        $('#deui_error_dialog_messageContent_Default').show();
                        break;
                }
                $('#deui_error_dialog_messageContent').show();
                $('#deui_error_dialog_errorMessage_details').hide();

            }
            var initDialog = function () {
                $('#deui_error_dialog_btnRetry').off("click.deui");
                $('#deui_error_dialog_btnCancel').off("click.deui");
                $('#deui_error_dialog_btnOk').off("click.deui");
                $('#deui_error_dialog_btnRetry').on("click.deui", onRetryClick);
                $('#deui_error_dialog_btnCancel').on("click.deui", onCancelClick);
                $('#deui_error_dialog_btnOk').on("click.deui", onOkClick);
                if (myOptions.showRetry == false) {
                    $('#deui_error_dialog_btnRetry').hide();
                }
                if (myOptions.showCancel == false) {
                    $('#deui_error_dialog_btnCancel').hide();
                }
                if (myOptions.showOk == false) {
                    $('#deui_error_dialog_btnOk').hide();
                }

                setDialogValues();
            }

            if ($dialogElement.length == 0) {
                $dialogElement = $('<div id="deui_error_dialog"></div>').dialog({ autoOpen: false });
                $.deui.getTemplateCache('error').then(
                    function (html) {
                        $dialogElement.html(html);
                        initDialog();
                    },
                    function () {
                        $.logToConsole("Error loading Error Dialog HTML");
                    }
                );

            } else {
                //setDialogValues();
                // had to unbind and rebind to get myOptions update wierd but myOptions would stay to last values when bound not update like they got scoped funny
                initDialog();
            }

            $dialogElement.dialog(myOptions.dialogOptions);
            $dialogElement.dialog("open");
            return myDefer.promise();
        },

        logout: function () {

            $.logToConsole("Debug: $.deui.logout Called");

            var myDeferred = $.Deferred();



            try {

                $.logToConsole("Debug: $.deui.logout sending logout to server")
                $.deui.ajax({
                    method: "GET",
                    //timeout: 60000,
                    dataType: "json",
                    url: "api/Account/Logoff",
                    success: function (result) {
                        //If no data is returned, spit up a message
                        if (!result || result == null) {


                            $.logToConsole("CRITICAL ERROR: $.deui.logout - No Data Returned");

                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.deui.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject("No Data Returned");
                        }
                        else if (result.error) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);
                        }
                        else if (result.success) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                            $.logToConsole("Debug: $.deui.logout Success");
                            myDeferred.resolve(result);
                        }
                    },  //End onSuccess
                    error: function (xhr, textStatus, thrownError) {
                        //this clears all of the Storage and UserInfo resets isLoggedIn etc
                        $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.deui.createErrorFromAjaxError(xhr, "Server error during logout.");
                        $.logToConsole("ERROR deui.logout.refreshToken: " + objError.message);
                        myDeferred.reject(objError);
                    }
                });


            } catch (ex) {
                $.logToConsole("ERROR deui.dal.logout: " + ex.toString());
                var objError = $.deui.createErrorFromScriptException(ex, "Server error during token refresh.");
                myDeferred.reject(ex.toString());
            }
            return myDeferred.promise();
        },

        hasAccessToken: function () {
            var myAccessToken = $.deui.getAccessToken();
            if (myAccessToken == undefined || myAccessToken == null) {
                return false;
            } else {
                return true;
            }
        },

        hasRefreshToken: function () {
            var myRefreshToken = $.deui.getRefreshToken();
            if (myRefreshToken == undefined || myRefreshToken == null) {
                return false;
            } else {
                return true;
            }
        },

        //hasAspNetApplicationCookie: function () {
        //    var myAspNetApplicationCookies = $.deui.getAspNetCookies();
        //    if (myAspNetApplicationCookies && myAspNetApplicationCookies.AspNetApplicationCookie) {
        //        return true;
        //    } else {
        //        return false;
        //    }
        //},

        //hasAspNetExternalCookie: function () {
        //    var myAspNetApplicationCookies = $.deui.getAspNetCookies();
        //    if (myAspNetApplicationCookies && myAspNetApplicationCookies.AspNetExternalCookie) {
        //        return true;
        //    } else {
        //        return false;
        //    }
        //},

        /*
          // This Function is used instead of a call $.ajax() it has the advantage of automatic handling of Login if 401 is returned,
          // it will automaticaly handle an accessToken expiration and use the refreshToken to request a new one.  
          // If a 401 is thrown and no refresh token is found it will pop a login modal and set the accessToken and refresh Token.
          // It will also handle errors that are not login errors and unless the allowRetryOnError:false is set will pop an error dialog to 
          // allow the user to retry the request.
          // This is all transparent to the caller.  If for some reason the user cancels the auto login and/or the 
        */

        ajax: function (url, options) {
            var deferred = $.Deferred(),
                promise = deferred.promise(),
                defaultOptions = {
                    showErrorDialog: true,
                    showLoginOn401Error: true,
                    contentType: "application/json",
                    dataType: 'json',
                    async: true,
                    cache: false,
                    success: $.noop,
                    error: $.noop,
                    complete: $.noop,
                    beforeSend: $.noop
                };



            options = options || {};

            if (typeof url === "object") {
                options = url;
            } else {
                options.url = url;
            }

            if ($.deui.isClientSideDebugging()) {
                $.logToConsole("Debug: Preparing to make a ajax call to: " + options.url);
            }

            // Overwrite default options with specified options
            var clonedDefaults = $.extend(true, defaultOptions, options);
            if (clonedDefaults.method == undefined && clonedDefaults.type == undefined) {
                if (clonedDefaults.data) {
                    clonedDefaults.method = "POST";
                } else {
                    clonedDefaults.method = "GET";
                }
            }
            var orginalCallbacks = {
                error: clonedDefaults.error,
                success: clonedDefaults.success,
                complete: clonedDefaults.complete,
                onBeforeSend: clonedDefaults.beforeSend
            };

            //If Json and data is object not string then stringify it 
            if (clonedDefaults.dataType == "json" && typeof (clonedDefaults.data) === "object") {
                clonedDefaults.data = JSON.stringify(clonedDefaults.data);
            }
            var addAccessTokenHeader = function (jqXHR, settings) {
                if (settings.crossDomain) {
                    return;
                }
                // Do not pass in accessToken we always use the current accessToken for the current login or pass undefined if not logged in
                if ($.deui.hasAccessToken()) {
                    if (settings && settings.headers && settings.headers.Authorization) {
                        $.logToConsole("$.deui.ajax Authorization Header was overwriten by Calling Function")
                    } else {
                        jqXHR.setRequestHeader('Authorization', 'Bearer ' + $.deui.getAccessToken());
                    }

                }

                if (orginalCallbacks.onBeforeSend) {
                    orginalCallbacks.onBeforeSend(jqXHR, settings);
                }
            }

            clonedDefaults.error = null;
            clonedDefaults.success = null;
            clonedDefaults.complete = null;
            clonedDefaults.beforeSend = addAccessTokenHeader;

            function retryCallback() {
                if ($.deui.isClientSideDebugging()) {
                    $.logToConsole("Debug: deui.ajax: doing $.ajax call to:" + clonedDefaults.url);
                }
                $.ajax(clonedDefaults).then(onSuccess, onError)
            }

            //Make the call 
            retryCallback();

            function onSuccess(data, textStatus, jqXHR) {
                if ($.deui.isClientSideDebugging()) {
                    $.logToConsole("Debug: deui.ajax: call successful to url:" + clonedDefaults.url);
                }


                orginalCallbacks.success(data, textStatus, jqXHR);

                deferred.resolve(data, textStatus, jqXHR);
            }

            function onError(jqXHR, textStatus, errorThrown) {
                function rejectCallback(reason) {
                    var objError = $.deui.createErrorFromScriptException(new Error("deui.ajax " + reason), reason);
                    orginalCallbacks.error(jqXHR, reason, objError);
                    deferred.reject(jqXHR, reason, objError);
                };

                if ($.deui.isClientSideDebugging()) {
                    $.logToConsole("Debug: deui.ajax: call error to url:" + clonedDefaults.url + " status:" + jqXHR.status + ", statusText:" + jqXHR.statusText);
                }
                console.info('$.deui.ajax onError() - Received status code [%s] and reason [%s]', jqXHR.status, jqXHR.statusText);

                switch (jqXHR.status) {
                    // Don't need this any more as default Error Handler will handle this 
                    //case 0:
                    //User is offline

                    // Don't need this any more as default Error Handler will handle this
                    //case 402:
                    // HTTP 402, Access is denied you tried to access a document that you do not have permissions to 

                    case 401:
                        if (clonedDefaults.showLoginOn401Error) {
                            // This is a unauthorized the StatusText tells us if this is an "Access Is 
                            // Denied" or "Not Logged In". If "Not Logged In" we need to try to refresh 
                            // the accessToken if we have a refreshToken or throw the Login Prompt In the 
                            // Server Side web APi 2 call you should be using 
                            // CTMSoftware.Common.RequestContext.EnsureLoggedInElseThrowUnauthorized to 
                            // ensure the user is logged in. To specificaly throw Access is Denied as 
                            // in user is logged in but does not have permission 
                            // 	" throw new  System.Web.Http.HttpResponseException(CTMRequestContext.GetAccessDeniedHttpResponseMessage()) "
                            // All API methods should be wrapped in Try Catch 

                            switch (jqXHR.statusText) {
                                case "Login Failed":
                                    $.deui.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "Refresh Token Expired or Invalid":
                                    $.logToConsole("Debug: deui.ajax: call error to url:\"" + clonedDefaults.url + "\". Refresh Token is invalid, clearing all the currently logged in information including refresh and auth tokens from storage");
                                    $.deui._clearLoginAccessTokenRefreshTokenAppCookie();
                                    $.deui.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "AccessToken Timeout":
                                    if ($.deui.hasRefreshToken() || $.deui.hasAspNetApplicationCookie()) {
                                        // Attempt to use the refresh token. If the server rejects the token as 
                                        // having been expired, show login 
                                        $.deui.getNewAccessToken().then(
                                            retryCallback,
                                            function (objError) {
                                                //console.log('accessToken timeout - attempted getNewAccessToken() failed, reason: ', objError)
                                                switch (objError.StatusCode) {
                                                    case 401: // This is the invalid or timed out getNewAccessToken error so throw the login Dialog
                                                        $.deui.showLoginDialog().then(retryCallback, rejectCallback);
                                                        break;
                                                    default:  //This is some other error such as server is down but happened during our token refresh so throw the error dialog
                                                        $.logToConsole("Fatal Error Refreshing Token");
                                                        if (clonedDefaults.showErrorDialog == true) {
                                                            $.deui.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
                                                        } else {
                                                            deferred.reject(jqXHR, reason, objError);
                                                        }
                                                }
                                            }
                                        );
                                    } else {
                                        // User does not have a refreshToken or LoginTrackCookie so show the Login dialog
                                        $.deui.showLoginDialog().then(retryCallback, rejectCallback);
                                    }
                                    break;
                            }
                        } else {
                            rejectCallback('');
                        }
                        break;
                    default:
                        if (clonedDefaults.url.indexOf('Log_Insert_Same_Event') == -1) {
                            $.logToConsole("Error Returned from Server Call to " + $.deui.cleanForjQuery(clonedDefaults.url + ", Error: " + errorThrown));
                        }

                        var objError = $.deui.createErrorFromAjaxError(jqXHR, "Error deui.ajax: Server error during call to " + $.deui.cleanForjQuery(clonedDefaults.url));
                        if (clonedDefaults.showErrorDialog) {
                            $.deui.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
                        } else {
                            deferred.reject(jqXHR, reason, objError);
                        }
                }
            }


            promise.always(orginalCallbacks.complete);
            return promise;
        },

        _setStorageRefreshToken: function (refreshToken, rememberMe) {
            if (typeof (window.sessionStorage) !== "undefined") {
                if (rememberMe == true) {
                    // Code for localStorage/sessionStorage.
                    window.localStorage.setItem("deuiRefreshToken", refreshToken)
                } else {
                    window.sessionStorage.setItem("deuiRefreshToken", refreshToken)
                }
            } else {
                $.cookie("deuiRefreshToken", refreshToken);
            }
        },
        _clearStorageRefreshToken: function () {
            if (typeof (window.sessionStorage) !== "undefined") {
                window.localStorage.removeItem("deuiRefreshToken")
                window.sessionStorage.removeItem("deuiRefreshToken")
            }
            $.removeCookie("deuiRefreshToken");
        },

        setAccessToken: function (accessToken) {
            $.deui.common.login.accessToken = accessToken;
            //$.deui._setStorageAccessToken(accessToken);
        },

        //_setStorageAccessToken: function (accessToken) {
        //    if (typeof (window.sessionStorage) !== "undefined") {
        //        window.sessionStorage.setItem("deuiAccessToken", accessToken);    
        //    } else {
        //        $.cookie("deuiAccessToken", accessToken);
        //    }
        //},
        //_clearStorageAccessToken: function () {
        //    if (typeof (window.sessionStorage) !== "undefined") {
        //        //window.localStorage.removeItem("deuiAccessToken")
        //        window.sessionStorage.removeItem("deuiAccessToken")
        //    }
        //    $.removeCookie("deuiAccessToken");
        //},

        _clearLoginAccessTokenRefreshTokenAiToken: function () {
            $.deui._clearStorageRefreshToken();
            //$.deui._clearStorageAccessToken();
            $.deui.common.login.accessToken = null;
            $.deui.common.login.userInfo = null;
            $.deui.common.login.isUserLoggedIn = false;
        },

        /*
        This function is used to fetch an authentication token for a user returns a promise object
        //on reject single parmeter of reason is return
        //on resolve done(aiTokens, user) as returned
        //added loginType Parmeter to Allow CTMOne and eContract logins until we merge them into CTmGlobal Andy 05/28/2015
        */

        login: function (options) {

            var myDeferred = $.Deferred();

            try {

                if ($.deui.isClientSideDebugging()) {
                    $.logToConsole("Debug: Calling $.deui.login");
                }

                var defaultOptions = {
                    grant_type: "password",   //can be password, externalBearer, refresh_token
                    username: null,
                    password: null,
                    token: null, //if using a externalBearer token set it here
                    refresh_token: null,  //if using a refresh_token set it here
                    client_id: "web",
                    client_secret: "www.digitalexample.com",
                    rememberme: false
                }
                var myOptions = $.extend(defaultOptions, options);


                //Check for username and password
                if (myOptions.grant_type == "password") {
                    if (myOptions.username == null || !$.trim(myOptions.username)) {
                        myDeferred.reject($.deui.createError("username is missing"));
                        return myDeferred.promise();

                    } else if (myOptions.password == null || !$.trim(myOptions.password)) {
                        myDeferred.reject($.deui.createError("password is missing"));
                        return myDeferred.promise();
                    }
                }

                $.ajax({
                    type: "POST",
                    //timeout: 60000,
                    dataType: "json",
                    //contentType: "application/json",
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    //data: JSON.stringify(postdata),
                    data: myOptions,
                    url: '/Token',
                    success: function (result) {
                        //If no data is returned, show message
                        if (!result) {
                            $.logToConsole("Error Login: " + "No Data Returned");

                            $.deui.common.login.isUserLoggedIn = false;
                            $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.deui.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject(objError);

                        }
                        else if (result.error) {
                            //if (options.debug)
                            //    $.logToConsole("Called deui.login.fetchToken: DATA RETURNED");
                            $.logToConsole("Error login result.error: " + result.error);
                            $.deui.common.login.isUserLoggedIn = false;
                            $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);

                        }
                        else if (result.access_token) {
                            $.logToConsole("Debug: $.deui.login Success");
                            $.deui._processLoginInfo(result, myOptions.rememberMe).then(
                                function (userInfo) {
                                    myDeferred.resolve(userInfo);
                                },
                                function (objError) {
                                    myDeferred.reject(objError);
                                }
                            );

                        }

                    },  //End onSuccess
                    error: function (xhr, textStatus, thrownError) {
                        $.deui.common.login.isUserLoggedIn = false;
                        $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.deui.createErrorFromAjaxError(xhr, "Server error during login.");
                        $.logToConsole("ERROR deui.login.fetchToken: " + objError.message);

                        myDeferred.reject(objError);
                    }

                });


            }
            catch (ex) {
                $.logToConsole("ERROR deui.login.fetchToken: " + ex);
                $.deui.common.login.isUserLoggedIn = false;
                var objError = $.deui.createErrorFromScriptException(ex);
                myDeferred.reject(objError);
            }
            return myDeferred.promise();
        },

        /*
          This function is common to login and register user as it handles the returned accessToken, refresh Token Data
        */
        _processLoginInfo: function (result, rememberMe, fetchUserInfo) {
            var myDeferred = $.Deferred();
            try {
                $.deui.setAccessToken(result.access_token, rememberMe);
                if (result.expires) {
                    $.deui.common.login.accessTokenExpires = result.expires;
                } else {
                    $.deui.common.login.accessTokenExpires = result[".expires"];
                }
                if (result.issued) {
                    $.deui.common.login.accessTokenIssued = result.issued;
                } else {
                    $.deui.common.login.accessTokenIssued = result[".issued"];
                }

                //Store the refreshToken for subsequent calls
                if (result.refresh_token) {
                    $.deui._setStorageRefreshToken(result.refresh_token, rememberMe);
                } else {
                    // Don't clear the refreshToken as it won't be returned with refresh_token calls
                    //$.deui._clearStorageRefreshToken();
                }

                //Login is only Successfull if we can also use the new token to get the userInfo /disable loginprompt and show error
                if (fetchUserInfo == undefined || fetchUserInfo == true) {
                    $.when($.deui.getUserInfo({ showErrorDialog: false, showLoginOn401Error: false }), $.deui.getUserSettings({ showErrorDialog: false, showLoginOn401Error: false }))
                        .then(function (userInfoResults, userSettingResults) {
                            $.deui.common.login.userInfo = userInfoResults;
                            $.deui.common.login.isUserLoggedIn = true;
                            $.deui.common.settings.user = userSettingResults;

                            myDeferred.resolve(userInfoResults);
                        }, function (userInfoResultsError, userSettingResultsError) {
                            $.deui.common.login.isUserLoggedIn = false;
                            $.deui._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = userInfoResultsError || userSettingResultsError; //$.deui.createErrorFromAjaxError(userInfoResultsError, "Error retriving UserInfo during ProcessLoginInfo.");
                            $.logToConsole("ERROR deui.login.getUserInfo: " + objError.message);
                            myDeferred.reject(objError);
                        });
                } else {
                    myDeferred.resolve();
                }
            } catch (ex) {
                $.logToConsole("ERROR deui.login.fetchToken: " + ex);
                $.deui.common.login.isUserLoggedIn = false;
                var objError = $.deui.createErrorFromScriptException(ex);
                myDeferred.reject(objError);
            }
            return myDeferred.promise();
        },


        /* 
            the autologin function returns a promise that is always resolved even if there is no refresh token used in deui.appinit.
            The purpose of this function is to check to see if the accessToken is avalible and is not expired
            if its not avalible but a refreshToken is avalible then the refresh Token is set to the server to exchange for
        */

        autoLogin: function () {
            var myDeferred = $.Deferred();
            //console.info('in autologin()');
            try {
                if ($.deui.isClientSideDebugging())
                    $.logToConsole("Debug: $.deui.autoLogin called");

                if ($.unmsdetools.hasNmsAuthToken()) {
                    $.deui.getNewAccessToken()
                        .done(function () {
                            if ($.deui.isClientSideDebugging()) {
                                $.logToConsole("Debug: $.deui.autoLogin success");
                            }
                            //console.log('autologin() refreshtoken().done');
                            myDeferred.resolve();
                        })
                        .fail(function () {
                            if ($.deui.isClientSideDebugging()) {
                                $.logToConsole("Debug: $.deui.autoLogin failed");
                            }
                            //console.log('autologin() refreshtoken().failed');
                            //console.trace()
                            //This function should never reject
                            myDeferred.resolve();
                        })
                } else {
                    $.logToConsole("Debug: $.deui.autoLogin no RefreshToken or aspnet.cookie Found so skipping autologin ");
                    //we always resolve in autologin
                    myDeferred.resolve();
                }

            }

            catch (ex) {
                $.logToConsole("ERROR $.deui.autoLogin: " + ex.toString());
                //this must be a resolve as its autologin and even if it errors it should be successful
                myDeferred.resolve();
            }

            return myDeferred.promise();
        },

        isClientSideDebugging: function () {
            //localhost always has clientside debuging enabled
            if (document.location.hostname == "localhost" || document.location.hostname == "localhost.digitalexample.com") {
                return true;
            }
            //if ($.deui.common.settings.isClientSideDebugging == null) {
            var DebugSetting = $.deui.getSystemSetting("clientSideDebug", "deui");
            if (DebugSetting) {
                //$.deui.common.settings.isClientSideDebugging = DebugSetting;
                return DebugSetting;
            } else {
                //$.deui.common.settings.isClientSideDebugging = false;
                return false;
            }
            //} else {
            //    return $.deui.common.settings.isClientSideDebugging;
            //}
        },
        


        createError: function (message, exceptionmessage, exceptiontype, stacktrace, statusCode) {
            if (statusCode == undefined) {
                statusCode = 500;
            }
            if (exceptionmessage == undefined) {
                exceptionmessage = message;
            }
            if (exceptiontype == undefined) {
                exceptiontype = 'client';
            }
            if (stacktrace == undefined) {
                try {
                    //We Throw an Error that was we get the full Javascript Stack Trace so we can tell what functions were called to get here
                    throw ("Dummy Error");
                } catch (ex) {
                    stacktrace = ex.stack;
                }
            }
            return { "error": true, "message": message, "exceptionMessage": exceptionmessage, "exceptionType": exceptiontype, "stackTrace": stacktrace, "statusCode": statusCode };
        },
        createErrorFromScriptException: function (ex, exceptionMessage) {
            if (!exceptionMessage) {
                exceptionMessage = $.deui.friendlyError;
            }
            if (typeof (ex) !== "object") {
                try {
                    var ex2;

                    if (typeof (ex) === "String") {
                        ex2 = new Error(ex)
                    } else {
                        ex2 = new Error("Invalid Error Type passed into createErrorFromScriptException")
                    }

                    throw (ex2);
                } catch (ex3) {
                    ex = ex3
                }
            }
            var msg = ex.message;
            var fullmsg = '';
            try {
                fullmsg = "Java Script Error: " + exceptionMessage + ':' + msg +
                    "Name:" + ex.name + "\n" +
                    "Message:" + ex.message + "\n" +
                    "File Name:" + ex.fileName + "\n" +
                    "Line Number:" + ex.lineNumber + "\n" +
                    "Stack Trace:" + ex.stack + "\n";

            } catch (ex2) {
                fullmsg = fullmsg + "CRITICAL ERROR: Building Error Message createErrorFromScriptException:" + ex2.toString();
            }
            return $.deui.createError(msg, exceptionMessage, "Client Error", fullmsg, 9999);
        },

        createErrorFromAjaxError: function (xhr, exceptionMessage) {
            xhr = xhr || {};
            exceptionMessage = exceptionMessage || $.deui.friendlyError;
            var msg = (xhr.statusText || $.deui.friendlyError),
                myurl = (xhr.url || ''),
                statusnum = ((xhr.status != undefined) ? xhr.status : 500),
                fullmsg = '',
                javascriptStackTrace = '';

            try {
                //We Throw an Error that was we get the full Javascript Stack Trace so we can tell what functions were called to get here
                throw ("Dummy Error");
            } catch (ex) {
                javascriptStackTrace = ex.stack;
            }

            try {
                //var statuscode = xhr.statusCode();
                if (xhr.responseJSON && (typeof xhr.responseJSON.error === 'string' || xhr.responseJSON.error == true)) {
                    var errorMsg = xhr.responseJSON.error_description || xhr.responseJSON.message || xhr.responseJSON.error;
                    var errorExceptionMessage = xhr.responseJSON.exceptionMessage || xhr.responseJSON.error;
                    //If this is a WebApi2 error then the statusCode will be a json object of type CTMError
                    fullmsg = "Message: Error during Ajax Request to " + myurl + "\n" +
                        "Status Code:" + xhr.status + "\n" +
                        "Status:" + xhr.responseJSON.exceptionType || xhr.statusText + "\n" +
                        "Status Text:" + errorExceptionMessage + "\n" +
                        "Server Message:" + errorMsg + "\n" +
                        "Server StackTrace:" + xhr.responseJSON.stackTrace || '' + "\n" +
                        "Response Headers:" + xhr.getAllResponseHeaders() + "\n" +
                        "Client Exception:" + exceptionMessage + "\n" +
                        "Client Message:" + msg + "\n" +
                        "Client StackTrace:" + javascriptStackTrace;
                    return $.deui.createError(errorMsg, errorExceptionMessage, "Server Error", fullmsg, xhr.status);
                } else {
                    fullmsg = "Message: Error during Ajax Request to " + myurl + "\n" +
                        "Status Code:" + xhr.status + "\n" +
                        "Status:" + statusnum + "\n" +
                        "Status Text:" + xhr.statusText + "\n" +
                        "Server Message:\n" +
                        "Server StackTrace:\n" +
                        "Response Headers:" + xhr.getAllResponseHeaders() + "\n" +
                        "Client Exception:" + exceptionMessage + "\n" +
                        "Client Message:" + msg + "\n" +
                        "Client StackTrace:" + javascriptStackTrace;
                }
                return $.deui.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            } catch (ex) {
                fullmsg += "Error Building Error Message createErrorFromAjaxError:" + ex.toString();
                return $.deui.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            }

        }

        

       

        


        // End -------------------------------------------------------

    });
})(jQuery);
