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
        } else if (qs.loginType && qs.loginType.toLowerCase() === "nms") {
            loginEndpoint = '/login/loginNms';
        } else {
            loginEndpoint = '/login/loginBoth';
            
        }

        $.post({ url: loginEndpoint, data }).then(
            function (data) {
                console.log(data);
                
            },
            function (jqXHR, textStatus, errorThrown) {
                
                var error = 'An Error has Occured!';
                if (jqXHR.responseJSON && jqXHR.responseJSON.msg) {
                    error = jqXHR.responseJSON.msg;                    
                }else if(errorThrown){
                    error = errorThrown;   
                }else{
                    if(jqXHR.status === 0){
                        error = "Server is Not Responding. Check your connection to the Internet.";
                    }else{
                        error = textStatus;
                    }
                    
                }
                $(".loginError").text(error).show();
            }
        )
    })

})