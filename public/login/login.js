$(function () {

    var ajaxErrorHandler = function (jqXHR, textStatus, errorThrown) {
        var error = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.msg) {
            error = jqXHR.responseJSON.msg;
        }
        $(".loginError").text(error).show();
    }

    $(".loginError").text('').hide();
    $.get({ url: "loginData" }).then(
        function (data) {

            let organization = data.organization
            $(document).prop('title', organization.name + ' - Login');
            $(".orgName").text(organization.name);
            let orgAddress = organization.street1;
            if (organization.street2) {
                orgAddress = orgAddress + ' ' + organization.street2;
            }
            orgAddress = orgAddress + ' ' + organization.city
            if (organization.stateCode) {
                orgAddress = orgAddress + ', ' + organization.stateCode
            }
            orgAddress = orgAddress + ' ' + organization.zipCode
            $(".orgAddress").text(orgAddress);
            $(".orgEmail").text(organization.email);
            $(".orgPhone").text(organization.phone);
            $(".orgWebsite").text(organization.website);
        },
        ajaxErrorHandler

    )

   

    $('.btnLogin').on("click", function (evt) {
        $(".loginError").text('').hide();
        var data = { username: $("#_username").val(), password: $("#_password").val() };
        var rememberme = true; //$("#_rememberme").prop("checked");

        if (data.username === '') {
            $(".loginError").text('Username is required').show();
            return;
        }
        if (data.password === '') {
            $(".loginError").text('Passsword is required').show();
            return;
        }
        var qs = $.getQueryStringParms();
        var loginEndpoint;
        var isNmsLogin;
        if (qs.loginType && qs.loginType.toLowerCase() === "crm") {
            loginEndpoint = '/login/loginCms';
            isNmsLogin = false;
        } else {
            loginEndpoint = '/login/loginNms';
            isNmsLogin = true;
        }

        $.post({ url: loginEndpoint, data }).then(
            function (data) {
                console.log(data);
                if (isNmsLogin) {
                    $.unmsdetools.setNmsAuthToken(data["x-auth-token"], rememberme);
                } else {
                    //Gees preaty sad they are sending interger ID not Guids so can't use them as auth going to have to build out a login to auth token method

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
    })

})