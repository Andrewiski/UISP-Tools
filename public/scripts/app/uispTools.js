(function ($) {

    /*
    * uisptools  1.0
    * Copyright (c) 2021 Digital Example
    * Date: 2021-09-15
    */

    /** The root class for the UISPTools UI framework
    @name uisptools
    @class This is the root class for the UISPTools jQuery UI framework
    */
    $.uisptools = $.uisptools || {};

    // Extend the uisptools class/namespace
    $.extend($.uisptools, {

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
                "login": { url: '/scripts/app/templates/login.htm', data: '', isLoaded: false },
                "error": { url: '/scripts/app/templates/error.htm', data: '', isLoaded: false },
                "defaultModal" : {url: '/scripts/app/templates/default.modal.htm', data: '', isLoaded: false}
                
            },
            menu: {
                menuItems: [],
                subMenuItems: [],
                currentMenu: null
            }
        },
        
        


        appInit: function () {
            var deferred = $.Deferred();

            //$.logToConsole("$.uisptools.appInit()");

            try {
                //added by Andy so we only Init Once   05/29/2015
                if ($.uisptools.properties.isInited === false) {
                    $.when(
                        $.uisptools.refreshTemplateCache(),
                        //After Initialization we want to auto login the user if possible
                        $.uisptools.autoLogin(),
                        
                        //$.uisptools.getSystemSettings(),
                        //is the GoogleLoginAPi Loaded if so lets init it
                        //$.uisptools.initExternalProviders()

                    ).done(function (x, data) {
                        //$.logToConsole("$.uisptools.appInit() DONE");

                        $.when(
                            $.uisptools.getMenuItems(),    
                            $.uisptools.loadPageContent()
                        ).done(function (x, data) {
                            $.uisptools.properties.isInited = true;
                            
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
                $.logToConsole('Fatal Error $.uisptools.appinit: ' + ex.message)
                var objError = $.uisptools.createErrorFromScriptException(ex);
                deferred.reject(objError);
            }
            return deferred.promise();
        },




        refreshTemplateCache: function () {
            var deferred = $.Deferred();
            var promiseArray = [];
            for (var myTemplateKey in $.uisptools.common.templateCache) {
                var myTemplate = $.uisptools.common.templateCache[myTemplateKey];
                promiseArray.push($.uisptools.getTemplateCache(myTemplateKey, true));
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
            $.uisptools.ajax({
                method: 'GET',
                url: 'uisptools/api/Settings/AnonymousClientSideSettings'
            }).then(
                function (results) {
                    $.uisptools.common.settings.system = results;
                    deferred.resolve();
                },
                function (reason) {
                    $.logToConsole("Error: uisptools.getSystemSettings failed " + reason);
                    deferred.reject(reason);
                }
            );
            return deferred.promise();
        },

        getUserSettings: function (options) {
            var deferred = $.Deferred();
            $.uisptools.ajax($.extend({
                method: 'GET',
                url: 'uisptools/api/Settings/UserClientSideSettings'
            }, options)).then(
                function (results) {
                    //$.uisptools.common.settings.user = results;
                    deferred.resolve(results);
                },
                function (reason) {
                    $.logToConsole("Error: uisptools.getUserSettings failed " + reason);
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
            //$.uisptools.showLoading();
            $.uisptools.getPageContent(pageOptions).then(function (page) {
                $.uisptools.showPageContent(page);
                //$.uisptools.hideLoading();
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
            $.uisptools.getPageContent({ pageContentGuid: pageContentGuid }).then(
                function (page) {
                    history.pushState({ page: page }, page.pageTitle, page.linkUrl);
                    $.uisptools.showPageContent(page);

                }
            );
        },


        getPageContent: function (options) {
            var deferred = $.Deferred();
            var url = '';
            if (options.pageContentGuid) {
                url = '/uisptools/api/PageContent/PageContentGuid/' + options.pageContentGuid;
            }else if (options.linkUrl) {
                url = '/uisptools/api/PageContent/LinkUrl/' + options.linkUrl;
            }
            else {
                url = '/uisptools/api/PageContent/PageContentGuid/00000000-0000-0000-0000-000000000001' ; //Home Page
            }
            $.uisptools.ajax({
                method: 'GET',
                url:  url
            }).then(
                function (page) {
                    deferred.resolve(page);
                },
                function (reason) {
                    $.logToConsole("Error: uisptools.getPageContent failed " + reason);
                    deferred.reject();
                }
            );
            return deferred.promise();
        },

        getMenuItems: function () {
            var deferred = $.Deferred();
            $.uisptools.ajax({
                method: 'GET',
                url: '/uisptools/api/PageContent/MenuItems'
            }).then(
                function (menuItems) {
                    $.uisptools.common.menu.menuItems = menuItems;
                    let $menuItemTemplate = $(".menuItemTemplate").find(".menuItem");
                    let $menuItemsContainer = $(".menuItems");
                    $menuItemsContainer.empty();
                    $.each(menuItems, function (index, item) {
                        if (item.roleId === undefined || item.roleId === null || item.roleId === '' || $.uisptools.isUserInRoleName(item.roleId)){
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
                                $menuItem.find("a").attr("href", "javascript:void(0)").attr("data-id", item.pageContentGuid).text(item.linkText).on("click", $.uisptools.menuItemClick);
                            }
                            $menuItemsContainer.append($menuItem);
                        }
                    });
                    
                    if($.uisptools.isUserLoggedIn === true){
                        //add Login MenuItem menuItemLoginTemplate
                        let $logoutMenuItem = $(".menuItemLogoutTemplate").find(".menuItem").clone();
                        $menuItemsContainer.append($logoutMenuItem);
                    }else{
                        //add Login MenuItem menuItemLoginTemplate
                        let $loginMenuItem = $(".menuItemLoginTemplate").find(".menuItem").clone();
                        $menuItemsContainer.append($loginMenuItem);
                    }
                    deferred.resolve();
                },
                function (reason) {
                    $.logToConsole("Error: uisptools.getMenuItems failed " + reason);
                    deferred.reject();
                }
            );
            return deferred.promise();
        },

        getTemplateCache: function (templateName, forceLoadFromServer) {
            var deferred = $.Deferred()
            var myTemplate = $.uisptools.common.templateCache[templateName];
            if (myTemplate.isLoaded == true && forceLoadFromServer == false) {
                deferred.resolve(myTemplate.data);
            } else {

                $.ajax({
                    url: myTemplate.url,
                    data: {},
                    success: function (data, textStatus, jqXHR) {
                        myTemplate.data = data;
                        myTemplate.isLoaded = true;
                        $.logToConsole('Refreshed Template Cache $.uisptools.getTemplateCache ' + templateName + ' : ' + myTemplate.url);
                        deferred.resolve(myTemplate.data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $.logToConsole('Error fetching Template Cache $.uisptools.getTemplateCache ' + templateName + ' : ' + myTemplate.url + ' ' + textStatus + ' ' + errorThrown);
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
                settingGroup = "uisptools";
            }
            var retval = $.uisptools.getUserSetting(settingName, SettingGroup);

            if (retval == undefined) {
                retval = $.uisptools.getSystemSetting(settingName, SettingGroup);
            } else {
                if (settingGroup != "uisptools" && settingName != 'clientSideDebug') {
                    $.logToConsole("CRITICAL ERROR: getSetting() retval = undefined")
                }
            }

            return retval;
        },

       
        //returns a SystemSetting Object if the setting is changed it will change globally
        getSystemSetting: function (settingName, settingGroup) {

            if (settingGroup === undefined) {
                settingGroup="uisptools"
            }
            //Loop the settings and look for the setting you want
            if (this.common.settings.system && this.common.settings.system[settingGroup]) {
                return this.common.settings.system[settingGroup][settingName];
            } else {
                if (settingGroup != "uisptools" && settingName != 'clientSideDebug') {
                    $.logToConsole("CRITICAL ERROR: getSystemSetting - this.common.settings.system = undefined");
                }
            }

            return undefined;
        },

        //returns a UserSetting Object if the setting is changed it will change globally
        getUserSetting: function (settingName, settingGroup) {
            if (settingGroup === undefined) {
                settingGroup = "uisptools";
            }
            //Loop the settings and look for the setting you want
            if (this.common.settings.user && this.common.settings.user[settingGroup]) {
                return this.common.settings.user[settingGroup][settingName];
            } else {
                if (settingGroup != "uisptools" && settingName != 'clientSideDebug') {
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
            return $.uisptools.showErrorDialog({ error: objError });
        },
        getErrorAccessIsDenied: function (debug) {
            return $.uisptools.createError("Access is denied", debug, "Client Error", "Access is denied", 402);
        },
        handleScriptException: function (ex, exceptionMessage) {
            var objError = $.uisptools.createErrorFromScriptException(ex, exceptionMessage);
            return $.uisptools.displayError(objError);
        },
        showLoginDialog: function (options) {
            // returns a promise which on success mean login on failure means user cancaled out of login
            var myDefer = jQuery.Deferred();
            //$.uisptools.loginDialogGlobal =  {isLoginDialogOpen: false, queuedLoginDialogRequests: []};
            if ($.uisptools.authGlobal.loginDialog.isLoginDialogOpen == true) {
                $.logToConsole("$.uisptools.showLoginDialog Dialog Already Open Queueing Promise");
                $.uisptools.authGlobal.loginDialog.queuedLoginDialogRequests.push(myDefer);
            } else {
                $.uisptools.authGlobal.loginDialog.isLoginDialogOpen = true;
                var trigger = "cancel";

                var defaultOptions = {
                    modalOptions: {backdrop:true, 
                        keyboard:true, 
                        focus:true
                    },
                    loginOptions: {
                        title: "Please Log In",
                        modalSize: "modal-fullscreen-md-down",
                        beforeClose: beforeClose,
                        showExternalLogins: true,
                        closeText: "Cancel"
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
                    $.uisptools.authGlobal.loginDialog.isLoginDialogOpen = false;
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
                    $('#uisptools_login_error').hide();

                    showLoading();
                    //$dialogElement.dialog('close');
                    loginData.userName = $('#uisptools_login_username').val();
                    loginData.password = $('#uisptools_login_password').val();
                    loginData.rememberMe = true; //$('#uisptools_login_rememberMe').is(':checked');

                    if (!loginData.userName) {
                        validationErrors += '<p>User Name can not be blank.</p>';
                    }
                    if (!loginData.password) {
                        validationErrors += '<p>Password can not be blank.</p>';
                    }
                    if (validationErrors) {
                        hideLoading();
                        $('#uisptools_login_errormsg').html(validationErrors);
                        $('#uisptools_login_error').show();
                        return;
                    }

                    $.uisptools.login({ grant_type: "password", username: loginData.userName, password: loginData.password, rememberMe: loginData.rememberMe }).then(
                        function (aiTokens, userInfo) {
                            //All of the $.uisptools.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            hideLoading();
                            $dialogElement.dialog('destroy');
                            myDefer.resolve(userInfo);
                            while ($.uisptools.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                                var myQueueDefered = $.uisptools.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                                myQueueDefered.resolve(userInfo);
                            }
                            $.uisptools.authGlobal.loginDialog.isLoginDialogOpen = false;
                        },
                        function (reason) {
                            console.log('Error: uisptools.showLoginDialog() SERVER RETURNED', reason);
                            hideLoading();
                            $('#uisptools_login_errormsg').html(reason);
                            $('#uisptools_login_error').show();
                            trigger = "cancel";
                            $.uisptools.authGlobal.loginDialog.isLoginDialogOpen = false;
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
                    while ($.uisptools.authGlobal.loginDialog.queuedLoginDialogRequests.length > 0) {
                        var myQueueDefered = $.uisptools.authGlobal.loginDialog.queuedLoginDialogRequests.pop();
                        myQueueDefered.reject(rejectReason);
                    }
                    $.uisptools.authGlobal.loginDialog.isLoginDialogOpen = false;

                }
                var setDialogValues = function () {
                    //trigger = "cancel"
                    if (loginData) {
                        $('#uisptools_login_username').val(loginData.userName || '');
                        $('#uisptools_login_password').val(loginData.password || '');
                        $('#uisptools_login_rememberMe').prop('checked', (loginData.rememberMe || false));
                    }

                }


                
                // Get markup for login and show it as a dialog

                $.when($.uisptools.getTemplateCache('defaultModal'), $.uisptools.getTemplateCache('login') ).done(
                    function (defaultModalhtml, loginhtml) {
                        $dialogElement = $(defaultModalhtml);
                        $dialogElement.find('.modal-body').html(loginhtml);
                        if(myOptions.loginOptions.modalSize){
                            $dialogElement.find('.modal-dialog').addClass(myOptions.loginOptions.modalSize);
                        }
                        if(myOptions.loginOptions.title){
                            
                            $dialogElement.find('.modal-title').text(myOptions.loginOptions.title);
                        }
                        $dialogElement.find('.btn-primary')
                            .text("Login")
                            .on('click', attemptLogin)
                            .end();
                        $dialogElement.find('.btn-secondary')
                            .text("Cancel")
                            .on('click', cancelLogin)
                            .end();
                        $dialogElement.find('input')
                            .on('keypress', function (event) {
                                if (event.which === 13) {
                                    attemptLogin();
                                }
                            })
                            .end();
                        
                        let myLoginModal = new bootstrap.Modal($dialogElement, myOptions.dialogOptions);
                        myLoginModal.show();
                        //$dialogElement.dialog(myOptions.dialogOptions);
                        setDialogValues();
                        GLOBALS = $('#uisptools_login_dialog');
                        $dialogContent = $('#uisptools_login_dialog');
                    },
                    function () {
                        $.logToConsole("Error loading Login Dialog HTML");
                    }
                );
            } // end if $.uisptools.loginDialogGlobal.isLoginDialogOpen
            return myDefer.promise();
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
                    appendTo: ".uisptools-body",
                    closeText: ""
                },
                error: undefined,
                showRetry: true,
                showCancel: true
            }
            var myOptions = $.extend(defaultOptions, options);

            if (options.error == undefined || options.error == null) {
                options.error = $.uisptools.createErrorFromScriptException("Default Error Handler Error", "Default Error Handler Error");
            }

            var $dialogElement = $('#uisptools_error_dialog');

            var onRetryClick = function () {
                trigger = "retry"
                $('#uisptools_error_dialog_error').hide();
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
                $("#uisptools_error_dialog_errorMessageDetails_displayedErrorMessage").text(myOptions.error.message);
                $("#uisptools_error_dialog_errorMessageDetails_ExceptionType").text(myOptions.error.exceptionType);
                $("#uisptools_error_dialog_errorMessageDetails_ExceptionMessage").text(myOptions.error.exceptionMessage);
                var stacktrace = myOptions.error.stackTrace;

                //TODO: This approach for displaying the stack trace is a problem waiting to happen if the stack trace contains markup
                //      we should leave the newlines alone and put the stacktrace inside a <pre> using jquery's .text()
                //
                //if (typeof stacktrace === 'string') {
                //    stacktrace = stacktrace.replace(/\n/gi, '<br/>');
                //}
                //$("#uisptools_error_dialog_errorMessageDetails_StackTrace").html(stacktrace);                
                $("#uisptools_error_dialog_errorMessageDetails_StackTrace").text(stacktrace);
                $('#uisptools_error_dialog_messageContent_Default').hide();
                $('#uisptools_error_dialog_messageContent_NoInternet').hide();
                $('#uisptools_error_dialog_messageContent_AccessDenied').hide();
                $('#uisptools_error_dialog_messageContent_NotFound').hide();
                switch (myOptions.error.StatusCode) {
                    case 0:
                        $('#uisptools_error_dialog_messageContent_NoInternet').show();
                        break;
                    case 402:
                        $('#uisptools_error_dialog_messageContent_AccessDenied').show();
                        break;
                    case 404:
                        $('#uisptools_error_dialog_messageContent_NotFound').show();
                        break;
                    default:
                        $('#uisptools_error_dialog_messageContent_Default').show();
                        break;
                }
                $('#uisptools_error_dialog_messageContent').show();
                $('#uisptools_error_dialog_errorMessage_details').hide();

            }
            var initDialog = function () {
                $('#uisptools_error_dialog_btnRetry').off("click.uisptools");
                $('#uisptools_error_dialog_btnCancel').off("click.uisptools");
                $('#uisptools_error_dialog_btnOk').off("click.uisptools");
                $('#uisptools_error_dialog_btnRetry').on("click.uisptools", onRetryClick);
                $('#uisptools_error_dialog_btnCancel').on("click.uisptools", onCancelClick);
                $('#uisptools_error_dialog_btnOk').on("click.uisptools", onOkClick);
                if (myOptions.showRetry == false) {
                    $('#uisptools_error_dialog_btnRetry').hide();
                }
                if (myOptions.showCancel == false) {
                    $('#uisptools_error_dialog_btnCancel').hide();
                }
                if (myOptions.showOk == false) {
                    $('#uisptools_error_dialog_btnOk').hide();
                }

                setDialogValues();
            }

            if ($dialogElement.length == 0) {
                $dialogElement = $('<div id="uisptools_error_dialog"></div>').dialog({ autoOpen: false });
                $.uisptools.getTemplateCache('error').then(
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

            $.logToConsole("Debug: $.uisptools.logout Called");

            var myDeferred = $.Deferred();



            try {

                $.logToConsole("Debug: $.uisptools.logout sending logout to server")
                $.uisptools.ajax({
                    method: "GET",
                    //timeout: 60000,
                    dataType: "json",
                    url: "api/Account/Logoff",
                    success: function (result) {
                        //If no data is returned, spit up a message
                        if (!result || result == null) {


                            $.logToConsole("CRITICAL ERROR: $.uisptools.logout - No Data Returned");

                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.uisptools.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject("No Data Returned");
                        }
                        else if (result.error) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);
                        }
                        else if (result.success) {
                            //this clears all of the Storage and UserInfo resets isLoggedIn etc
                            $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                            $.logToConsole("Debug: $.uisptools.logout Success");
                            myDeferred.resolve(result);
                        }
                    },  //End onSuccess
                    error: function (xhr, textStatus, thrownError) {
                        //this clears all of the Storage and UserInfo resets isLoggedIn etc
                        $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.uisptools.createErrorFromAjaxError(xhr, "Server error during logout.");
                        $.logToConsole("ERROR uisptools.logout.refreshToken: " + objError.message);
                        myDeferred.reject(objError);
                    }
                });


            } catch (ex) {
                $.logToConsole("ERROR uisptools.dal.logout: " + ex.toString());
                var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during token refresh.");
                myDeferred.reject(ex.toString());
            }
            return myDeferred.promise();
        },

        hasAccessToken: function () {
            var myAccessToken = $.uisptools.getAccessToken();
            if (myAccessToken == undefined || myAccessToken == null) {
                return false;
            } else {
                return true;
            }
        },

        hasRefreshToken: function () {
            var myRefreshToken = $.uisptools.getRefreshToken();
            if (myRefreshToken == undefined || myRefreshToken == null) {
                return false;
            } else {
                return true;
            }
        },

        getAccessToken: function () {
            
            var accessToken;

            if ($.uisptools.common.login.accessToken) {
                accessToken = $.uisptools.common.login.accessToken
            }
            if (accessToken) {
                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: $.uisptools.getAccessToken Found access Token in $.uisptools.common.login.accessToken");
                }

                return accessToken;
            }

            

            
            $.logToConsole("Debug: $.uisptools.getAccessToken no acess token found in js storage or cookies");
            
            return;
        },

        getNewAccessToken: function (options) {
            //console.log('in refreshToken()');
            var defaults = {
                data: {
                    grant_type: "refresh_token",
                    refresh_token: $.uisptools.getRefreshToken()
                }
            }
            var objOptions = $.extend({}, defaults, options);

            var myDeferred = $.Deferred();
            $.logToConsole("Debug: $.uisptools.getNewAccessToken called");
            try {
                if ($.uisptools.authGlobal.getNewAccessToken.isPending == true) {
                    $.logToConsole("$.uisptools.getNewAccessToken Already In Progress Queueing Promise");
                    $.uisptools.authGlobal.getNewAccessToken.queuedRequests.push(myDeferred);
                } else {
                    $.uisptools.authGlobal.getNewAccessToken.isPending = true;

                    if (objOptions.data.grant_type == "refresh_token" && $.uisptools.hasRefreshToken() == false) {
                        //console.log('refreshToken() - myRefreshToken not found');
                        throw (new Error("Missing Refresh Token"));
                    }
                    // call login with the refresh_token
                    $.uisptools.login(objOptions.data).then(function (result) {
                        console.log('getNewAccessToken() resolving because its all good');
                        $.uisptools.authGlobal.getNewAccessToken.isPending = false;
                        myDeferred.resolve(result);
                        while ($.uisptools.authGlobal.getNewAccessToken.queuedRequests.length > 0) {
                            var myQueueDefered = $.uisptools.authGlobal.getNewAccessToken.queuedRequests.pop();
                            myQueueDefered.resolve(result);
                        }                        
                    },
                    function (objError) {
                        $.uisptools.authGlobal.getNewAccessToken.isPending = false;
                        myDeferred.reject(objError);
                        while ($.uisptools.authGlobal.getNewAccessToken.queuedRequests.length > 0) {
                            var myQueueDefered = $.uisptools.authGlobal.getNewAccessToken.queuedRequests.pop();
                            myQueueDefered.reject(objError);
                        }
                        
                    }
                    )
                    

                    
                } //end if
            }
            catch (ex) {
                $.uisptools.common.login.isUserLoggedIn = false;
                $.logToConsole("ERROR uisptools.getNewAccessToken: " + ex.toString());
                var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during getNewAccessToken.");
                console.log('getNewAccessToken() CAUGHT EXCEPTION - REJECTING', ex);
                myDeferred.reject(objError);
            }
            
            return myDeferred.promise();
        },

        getRefreshToken: function () {
            if ($.uisptools.isClientSideDebugging()) {
                $.logToConsole("Debug: $.uisptools.getRefreshToken Called");
            }
            var refreshToken;

            if (typeof (window.sessionStorage) !== "undefined") {
                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: $.uisptools.getRefreshToken Browser Supports javascript Storage");
                }

                refreshToken = window.localStorage.uisptoolsRefreshToken;

                if (refreshToken) {
                    if ($.uisptools.isClientSideDebugging()) {
                        $.logToConsole("Debug: $.uisptools.getRefreshToken Found Refresh Token in localStorage");
                    }

                    return refreshToken;
                }

                refreshToken = window.sessionStorage.uisptoolsRefreshToken;

                if (refreshToken) {
                    if ($.uisptools.isClientSideDebugging()) {
                        $.logToConsole("Debug: $.uisptools.getRefreshToken Found Token in Temp sessionStorage");
                    }

                    return refreshToken;
                }
            }
            if (Cookies.get("uisptoolsRefreshToken")) {
                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: $.uisptools.getRefreshToken Found Refresh Token in Cookies");
                }                    
                return Cookies.get("uisptoolsRefreshToken");
            }

            if ($.uisptools.isClientSideDebugging()) {
                $.logToConsole("Debug: $.uisptools.getRefreshToken no refresh token found in js storage or cookies");
            }
            return;
        },

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

            if ($.uisptools.isClientSideDebugging()) {
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
                if ($.uisptools.hasAccessToken()) {
                    if (settings && settings.headers && settings.headers.Authorization) {
                        $.logToConsole("$.uisptools.ajax Authorization Header was overwriten by Calling Function")
                    } else {
                        jqXHR.setRequestHeader('Authorization', 'Bearer ' + $.uisptools.getAccessToken());
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
                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: uisptools.ajax: doing $.ajax call to:" + clonedDefaults.url);
                }
                $.ajax(clonedDefaults).then(onSuccess, onError)
            }

            //Make the call 
            retryCallback();

            function onSuccess(data, textStatus, jqXHR) {
                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: uisptools.ajax: call successful to url:" + clonedDefaults.url);
                }


                orginalCallbacks.success(data, textStatus, jqXHR);

                deferred.resolve(data, textStatus, jqXHR);
            }

            function onError(jqXHR, textStatus, errorThrown) {
                function rejectCallback(reason) {
                    var objError = $.uisptools.createErrorFromScriptException(new Error("uisptools.ajax " + reason), reason);
                    orginalCallbacks.error(jqXHR, reason, objError);
                    deferred.reject(jqXHR, reason, objError);
                };

                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: uisptools.ajax: call error to url:" + clonedDefaults.url + " status:" + jqXHR.status + ", statusText:" + jqXHR.statusText);
                }
                console.info('$.uisptools.ajax onError() - Received status code [%s] and reason [%s]', jqXHR.status, jqXHR.statusText);

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
                                    $.uisptools.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "Refresh Token Expired or Invalid":
                                    $.logToConsole("Debug: uisptools.ajax: call error to url:\"" + clonedDefaults.url + "\". Refresh Token is invalid, clearing all the currently logged in information including refresh and auth tokens from storage");
                                    $.uisptools._clearLoginAccessTokenRefreshTokenAppCookie();
                                    $.uisptools.showLoginDialog().then(retryCallback, rejectCallback);
                                    break;
                                case "AccessToken Timeout":
                                    if ($.uisptools.hasRefreshToken() || $.uisptools.hasAspNetApplicationCookie()) {
                                        // Attempt to use the refresh token. If the server rejects the token as 
                                        // having been expired, show login 
                                        $.uisptools.getNewAccessToken().then(
                                            retryCallback,
                                            function (objError) {
                                                //console.log('accessToken timeout - attempted getNewAccessToken() failed, reason: ', objError)
                                                switch (objError.StatusCode) {
                                                    case 401: // This is the invalid or timed out getNewAccessToken error so throw the login Dialog
                                                        $.uisptools.showLoginDialog().then(retryCallback, rejectCallback);
                                                        break;
                                                    default:  //This is some other error such as server is down but happened during our token refresh so throw the error dialog
                                                        $.logToConsole("Fatal Error Refreshing Token");
                                                        if (clonedDefaults.showErrorDialog == true) {
                                                            $.uisptools.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
                                                        } else {
                                                            deferred.reject(jqXHR, reason, objError);
                                                        }
                                                }
                                            }
                                        );
                                    } else {
                                        // User does not have a refreshToken or LoginTrackCookie so show the Login dialog
                                        $.uisptools.showLoginDialog().then(retryCallback, rejectCallback);
                                    }
                                    break;
                            }
                        } else {
                            rejectCallback('');
                        }
                        break;
                    default:
                        if (clonedDefaults.url.indexOf('Log_Insert_Same_Event') == -1) {
                            $.logToConsole("Error Returned from Server Call to " + $.uisptools.cleanForjQuery(clonedDefaults.url + ", Error: " + errorThrown));
                        }

                        var objError = $.uisptools.createErrorFromAjaxError(jqXHR, "Error uisptools.ajax: Server error during call to " + $.uisptools.cleanForjQuery(clonedDefaults.url));
                        if (clonedDefaults.showErrorDialog) {
                            $.uisptools.showErrorDialog({ "error": objError }).then(retryCallback, rejectCallback);
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
                    window.localStorage.setItem("uisptoolsRefreshToken", refreshToken)
                } else {
                    window.sessionStorage.setItem("uisptoolsRefreshToken", refreshToken)
                }
            } else {
                Cookies.set("uisptoolsRefreshToken", refreshToken);
            }
        },
        _clearStorageRefreshToken: function () {
            if (typeof (window.sessionStorage) !== "undefined") {
                window.localStorage.removeItem("uisptoolsRefreshToken")
                window.sessionStorage.removeItem("uisptoolsRefreshToken")
            }
            Cookies.remove("uisptoolsRefreshToken");
        },

        setAccessToken: function (accessToken) {
            $.uisptools.common.login.accessToken = accessToken;
            //$.uisptools._setStorageAccessToken(accessToken);
        },

        //_setStorageAccessToken: function (accessToken) {
        //    if (typeof (window.sessionStorage) !== "undefined") {
        //        window.sessionStorage.setItem("uisptoolsAccessToken", accessToken);    
        //    } else {
        //        Cookies.set("uisptoolsAccessToken", accessToken);
        //    }
        //},
        //_clearStorageAccessToken: function () {
        //    if (typeof (window.sessionStorage) !== "undefined") {
        //        //window.localStorage.removeItem("uisptoolsAccessToken")
        //        window.sessionStorage.removeItem("uisptoolsAccessToken")
        //    }
        //    Cookies.remove("uisptoolsAccessToken");
        //},

        _clearLoginAccessTokenRefreshTokenAiToken: function () {
            $.uisptools._clearStorageRefreshToken();
            //$.uisptools._clearStorageAccessToken();
            $.uisptools.common.login.accessToken = null;
            $.uisptools.common.login.userInfo = null;
            $.uisptools.common.login.isUserLoggedIn = false;
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

                if ($.uisptools.isClientSideDebugging()) {
                    $.logToConsole("Debug: Calling $.uisptools.login");
                }

                var defaultOptions = {
                    grant_type: "password",   //can be password, externalBearer, refresh_token
                    username: null,
                    password: null,
                    token: null, //if using a externalBearer token set it here
                    refresh_token: null,
                    rememberme: false
                }
                var myOptions = $.extend(defaultOptions, options);


                //Check for username and password
                if (myOptions.grant_type == "password") {
                    if (myOptions.username == null || !$.trim(myOptions.username)) {
                        myDeferred.reject($.uisptools.createError("username is missing"));
                        return myDeferred.promise();

                    } else if (myOptions.password == null || !$.trim(myOptions.password)) {
                        myDeferred.reject($.uisptools.createError("password is missing"));
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

                            $.uisptools.common.login.isUserLoggedIn = false;
                            $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = $.uisptools.createErrorFromScriptException(new Error("No Data Returned"), "No Data returned by server");
                            myDeferred.reject(objError);

                        }
                        else if (result.error) {
                            //if (options.debug)
                            //    $.logToConsole("Called uisptools.login.fetchToken: DATA RETURNED");
                            $.logToConsole("Error login result.error: " + result.error);
                            $.uisptools.common.login.isUserLoggedIn = false;
                            $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                            myDeferred.reject(result);

                        }
                        else if (result.access_token) {
                            $.logToConsole("Debug: $.uisptools.login Success");
                            $.uisptools._processLoginInfo(result, myOptions.rememberMe).then(
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
                        $.uisptools.common.login.isUserLoggedIn = false;
                        $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                        var objError = $.uisptools.createErrorFromAjaxError(xhr, "Server error during login.");
                        $.logToConsole("ERROR uisptools.login.fetchToken: " + objError.message);

                        myDeferred.reject(objError);
                    }

                });


            }
            catch (ex) {
                $.logToConsole("ERROR uisptools.login.fetchToken: " + ex);
                $.uisptools.common.login.isUserLoggedIn = false;
                var objError = $.uisptools.createErrorFromScriptException(ex);
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
                $.uisptools.setAccessToken(result.access_token, rememberMe);
                if (result.expires) {
                    $.uisptools.common.login.accessTokenExpires = result.expires;
                } else {
                    $.uisptools.common.login.accessTokenExpires = result[".expires"];
                }
                if (result.issued) {
                    $.uisptools.common.login.accessTokenIssued = result.issued;
                } else {
                    $.uisptools.common.login.accessTokenIssued = result[".issued"];
                }

                //Store the refreshToken for subsequent calls
                if (result.refresh_token) {
                    $.uisptools._setStorageRefreshToken(result.refresh_token, rememberMe);
                } else {
                    // Don't clear the refreshToken as it won't be returned with refresh_token calls
                    //$.uisptools._clearStorageRefreshToken();
                }

                //Login is only Successfull if we can also use the new token to get the userInfo /disable loginprompt and show error
                if (fetchUserInfo == undefined || fetchUserInfo == true) {
                    $.when($.uisptools.getUserInfo({ showErrorDialog: false, showLoginOn401Error: false }), $.uisptools.getUserSettings({ showErrorDialog: false, showLoginOn401Error: false }))
                        .then(function (userInfoResults, userSettingResults) {
                            $.uisptools.common.login.userInfo = userInfoResults;
                            $.uisptools.common.login.isUserLoggedIn = true;
                            $.uisptools.common.settings.user = userSettingResults;

                            myDeferred.resolve(userInfoResults);
                        }, function (userInfoResultsError, userSettingResultsError) {
                            $.uisptools.common.login.isUserLoggedIn = false;
                            $.uisptools._clearLoginAccessTokenRefreshTokenAiToken();
                            var objError = userInfoResultsError || userSettingResultsError; //$.uisptools.createErrorFromAjaxError(userInfoResultsError, "Error retriving UserInfo during ProcessLoginInfo.");
                            $.logToConsole("ERROR uisptools.login.getUserInfo: " + objError.message);
                            myDeferred.reject(objError);
                        });
                } else {
                    myDeferred.resolve();
                }
            } catch (ex) {
                $.logToConsole("ERROR uisptools.login.fetchToken: " + ex);
                $.uisptools.common.login.isUserLoggedIn = false;
                var objError = $.uisptools.createErrorFromScriptException(ex);
                myDeferred.reject(objError);
            }
            return myDeferred.promise();
        },


        /* 
            the autologin function returns a promise that is always resolved even if there is no refresh token used in uisptools.appinit.
            The purpose of this function is to check to see if the accessToken is avalible and is not expired
            if its not avalible but a refreshToken is avalible then the refresh Token is set to the server to exchange for
        */

        autoLogin: function () {
            var myDeferred = $.Deferred();
            //console.info('in autologin()');
            try {
                if ($.uisptools.isClientSideDebugging())
                    $.logToConsole("Debug: $.uisptools.autoLogin called");

                if ($.uisptools.hasRefreshToken()) {
                    $.uisptools.getNewAccessToken()
                        .done(function () {
                            if ($.uisptools.isClientSideDebugging()) {
                                $.logToConsole("Debug: $.uisptools.autoLogin success");
                            }
                            //console.log('autologin() refreshtoken().done');
                            myDeferred.resolve();
                        })
                        .fail(function () {
                            if ($.uisptools.isClientSideDebugging()) {
                                $.logToConsole("Debug: $.uisptools.autoLogin failed");
                            }
                            //console.log('autologin() refreshtoken().failed');
                            //console.trace()
                            //This function should never reject
                            myDeferred.resolve();
                        })
                } else {
                    $.logToConsole("Debug: $.uisptools.autoLogin no RefreshToken or aspnet.cookie Found so skipping autologin ");
                    //we always resolve in autologin
                    myDeferred.resolve();
                }

            }

            catch (ex) {
                $.logToConsole("ERROR $.uisptools.autoLogin: " + ex.toString());
                //this must be a resolve as its autologin and even if it errors it should be successful
                myDeferred.resolve();
            }

            return myDeferred.promise();
        },

        isClientSideDebugging: function () {
            //localhost always has clientside debuging enabled
            if (document.location.hostname == "localhost" || document.location.hostname == "127.0.0.1") {
                return true;
            }
            //if ($.uisptools.common.settings.isClientSideDebugging == null) {
            var DebugSetting = $.uisptools.getSystemSetting("clientSideDebug", "uisptools");
            if (DebugSetting) {
                //$.uisptools.common.settings.isClientSideDebugging = DebugSetting;
                return DebugSetting;
            } else {
                //$.uisptools.common.settings.isClientSideDebugging = false;
                return false;
            }
            //} else {
            //    return $.uisptools.common.settings.isClientSideDebugging;
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
                exceptionMessage = $.uisptools.friendlyError;
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
            return $.uisptools.createError(msg, exceptionMessage, "Client Error", fullmsg, 9999);
        },

        createErrorFromAjaxError: function (xhr, exceptionMessage) {
            xhr = xhr || {};
            exceptionMessage = exceptionMessage || $.uisptools.friendlyError;
            var msg = (xhr.statusText || $.uisptools.friendlyError),
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
                    return $.uisptools.createError(errorMsg, errorExceptionMessage, "Server Error", fullmsg, xhr.status);
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
                return $.uisptools.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            } catch (ex) {
                fullmsg += "Error Building Error Message createErrorFromAjaxError:" + ex.toString();
                return $.uisptools.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            }

        },



        // Begin Auth

        isUserInRole: function (roleId) {
            var foundRole = false;
            if ($.uisptools.common.login.isUserLoggedIn && $.uisptools.common.login.userInfo.roles) {
                $.each($.uisptools.common.login.userInfo.roles, function (index, value) {
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
            if ($.uisptools.common.login.isUserLoggedIn && $.uisptools.common.login.userInfo.roles) {
                roleName = roleName.toLowerCase();
                $.each($.uisptools.common.login.userInfo.roles, function (index, value) {
                    if (value.roleName.toLowerCase() == roleName) {
                        foundRole = true;
                        return false;
                    }
                })
            }

            return foundRole;

        },

        isUserLoggedIn: function () {
            
            if ($.uisptools.common.login.isUserLoggedIn === true ) {
                        return true;
            
            }else{
                return false;
            }

        },

        
        // End Auth -------------------------------------------------------




        //Begin Common Error Handler

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
                exceptionMessage = $.uisptools.friendlyError;
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
            return $.uisptools.createError(msg, exceptionMessage, "Client Error", fullmsg, 9999);
        },

        createErrorFromAjaxError: function (xhr, exceptionMessage) {
            xhr = xhr || {};
            exceptionMessage = exceptionMessage || $.uisptools.friendlyError;
            var msg = (xhr.statusText || $.uisptools.friendlyError),
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
                    return $.uisptools.createError(errorMsg, errorExceptionMessage, "Server Error", fullmsg, xhr.status);
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
                return $.uisptools.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            } catch (ex) {
                fullmsg += "Error Building Error Message createErrorFromAjaxError:" + ex.toString();
                return $.uisptools.createError(msg, exceptionMessage, "Client Error", fullmsg, statusnum);
            }

        }

        //End Common Error Handler
    });
})(jQuery);
