/**
 * Created by Apurva on 3/8/2016.
 */

var token = localStorage.getItem('authorization-token');
if (token) {
    $.ajax({
            url: 'http://ec2-52-32-39-143.us-west-2.compute.amazonaws.com:8001/api/event_management/participants',
            type: 'GET',
            crossDomain: true,
            async: false,
            headers: {'Authorization': token},
            success: function (result) {
                if (result.status === 200) {
                    window.location.replace('dashboard.html');
                } else {
                    localStorage.removeItem('authorization-token');
                    window.location.reload();
                }
            },
            error: function () {
                localStorage.removeItem('authorization-token');
                window.location.reload();
            }
        }
    );
}

$(document).ready(function () {
    $('#loginWindow').animate({'width': '100%'}, 500)
        .delay(30)
        .animate({'height': '300px'}, 500);
    $('.page-header, .input-group, .btn')
        .delay(850)
        .animate({'opacity': '100'}, 7000);

    $("#submit-button").on('click', function () {
        resetFeedback();
        if (!validateUsername($('#email').val())) {
            feedbackInvalidEmail()
        } else if (!validatePassword($('#password').val())) {
            feedbackInvalidPassword();
        } else {
            var userData = {
                email: $('#email').val(),
                password: $('#password').val()
            };
            $.ajax({
                    url: 'http://ec2-52-32-39-143.us-west-2.compute.amazonaws.com:8001/api/event_management/login',
                    type: 'POST',
                    dataType: 'json',
                    crossDomain: true,
                    data: JSON.stringify(userData),
                    success: function (result) {
                        if (result.status === 200) {
                            var token = result.message;
                            localStorage.setItem('authorization-token', token);
                            window.location.href = 'dashboard.html';
                        } else {
                            feedbackInvalidEmail();
                        }
                    },
                    error: function () {
                        console.log('Login error');
                        localStorage.removeItem('authorization-token');
                        window.location.reload();
                    }
                }
            );
        }
    });
});

function validateUsername(email) {
    var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    var passwordRegex = /^([a-zA-Z0-9_-]{6})$/;
    return passwordRegex.test(password);
}

function feedbackInvalidEmail() {
    $('#u16-login-email-div').addClass('has-error');
    $('#u16-login-password-div').addClass('has-error');
    $('#email').val('');
    $('#password').val('');
    $('#error-message').html('Incorrect email or password');
    $('#loginWindow').animate({'height': '350px'}, 100);
}

function feedbackInvalidPassword() {
    $('#u16-login-password-div').addClass('has-error');
    $('#password').val('');
    $('#error-message').html('Please enter valid password');
    $('#loginWindow').animate({'height': '350px'}, 100);
}

function resetFeedback() {
    $('#u16-login-password-div').removeClass('has-error');
    $('#u16-login-email-div').removeClass('has-error');
    $('#error-message').html('').removeClass('has-error');
    $('#loginWindow').animate({'height': '300px'}, 100);
}