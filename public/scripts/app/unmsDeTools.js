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
    $.unmsdetools = $.unmsdetools || {};

    // Extend the deui class/namespace
    $.extend($.unmsdetools, {

        hasCrmAuthToken: function () {
            var crmAuthToken = $.unmsdetools.getCrmAuthToken();
            if (crmAuthToken == undefined || crmAuthToken == null) {
                return false;
            } else {
                return true;
            }
        },

       
        getCrmAuthToken: function () {
            var crmAuthToken;
            if (typeof (window.sessionStorage) !== "undefined") {
                crmAuthToken = window.localStorage.crmAuthToken;
                if (crmAuthToken) {
                    return crmAuthToken;
                }
                crmAuthToken = window.sessionStorage.crmAuthToken;
                if (crmAuthToken) {
                    return crmAuthToken;
                }
            }
            if ($.cookie("crmAuthToken")) {
                return $.cookie("crmAuthToken");
            }
            return;
        },

        setCrmAuthToken: function (crmAuthToken, rememberMe) {
            if (typeof (window.sessionStorage) !== "undefined") {
                if (rememberMe == true) {
                    // Code for localStorage/sessionStorage.
                    window.localStorage.setItem("crmAuthToken", crmAuthToken)
                } else {
                    window.sessionStorage.setItem("crmAuthToken", crmAuthToken)
                }
            } else {
                $.cookie("crmAuthToken", crmAuthToken);
            }
        },
        clearCrmAuthToken: function () {
            if (typeof (window.sessionStorage) !== "undefined") {
                window.localStorage.removeItem("crmAuthToken")
                window.sessionStorage.removeItem("crmAuthToken")
            }
            $.removeCookie("crmAuthToken");
        },


        hasNmsAuthToken: function () {
            var nmsAuthToken = $.unmsdetools.getNmsAuthToken();
            if (nmsAuthToken == undefined || nmsAuthToken == null) {
                return false;
            } else {
                return true;
            }
        },


        getNmsAuthToken: function () {
            var nmsAuthToken;
            if (typeof (window.sessionStorage) !== "undefined") {
                nmsAuthToken = window.localStorage.crmAuthToken;
                if (nmsAuthToken) {
                    return nmsAuthToken;
                }
                nmsAuthToken = window.sessionStorage.crmAuthToken;
                if (nmsAuthToken) {
                    return nmsAuthToken;
                }
            }
            if ($.cookie("nmsAuthToken")) {
                return $.cookie("nmsAuthToken");
            }
            return;
        },

        setNmsAuthToken: function (nmsAuthToken, rememberMe) {
            if (typeof (window.sessionStorage) !== "undefined") {
                if (rememberMe == true) {
                    // Code for localStorage/sessionStorage.
                    window.localStorage.setItem("nmsAuthToken", nmsAuthToken)
                } else {
                    window.sessionStorage.setItem("nmsAuthToken", nmsAuthToken)
                }
            } else {
                $.cookie("nmsAuthToken", crmAuthToken);
            }
        },
        clearNmsAuthToken: function () {
            if (typeof (window.sessionStorage) !== "undefined") {
                window.localStorage.removeItem("nmsAuthToken")
                window.sessionStorage.removeItem("nmsAuthToken")
            }
            $.removeCookie("nmsAuthToken");
        },

        getNmsUserInfo: function () {
            var myDeferred = $.Deferred();
            try {
                var nmsAuthToken = this.getNmsAuthToken();
                if (nmsAuthToken) {
                    $.post({ url: loginEndpoint, data }).then(
                        function (data) {
                            console.log(data);
                            if (isNmsLogin) {
                                $.unmsdetools.setNmsAuthToken(data["x-auth-token"], rememberme);
                            } else {
                                //Gees preaty sad in CRM they are sending interger ID not Guids on auth so can't use them as auth going to have to build out a login to auth token method

                            }
                        },
                        function (jqXHR, textStatus, errorThrown) {
                            var error = errorThrown;
                            if (jqXHR.responseJSON && jqXHR.responseJSON.msg) {
                                error = jqXHR.responseJSON.msg;
                            }
                            $(".loginError").text(error).show();
                        }
                    )
            
                } else {
                    $.logToConsole("Debug: $.unmsdetools.getNmsUserInfo no nmsAuthToken Found ");
                    //we always resolve in autologin
                    myDeferred.resolve();
                }

            }catch (ex) {
                $.logToConsole("ERROR $.unmsdetools.getNmsUserInfo: " + ex.toString());
                //this must be a resolve as its autologin and even if it errors it should be successful
                myDeferred.reject();
            }

            return myDeferred.promise();
        },


        
        // End Auth -------------------------------------------------------

    });
})(jQuery);
