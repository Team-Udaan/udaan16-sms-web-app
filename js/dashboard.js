/**
 * Created by Binny Gandhi on 15-03-2016.
 */

var app = {};

app.token = localStorage.getItem('authorization-token');
if (app.token) {
    $.ajax({
        url: config.baseUrl + '/api/event_management/participants',
            type: 'GET',
            crossDomain: true,
            async: false,
            headers: {'Authorization': app.token},
            success: function (result) {
                if (result.status === 200) {
                    var participantData = result.message.participants;
                    app.eventName = result.message.eventName;

                    for (var i = 0; i < participantData.length; i++) {
                        participantData[i].names = participantData[i].names.replace(/\n/g, '<br />');
                    }

                    app.participant = participantData;
                } else {
                    localStorage.removeItem('authorization-token');
                    window.location.replace('index.html');
                }
            },
            error: function () {
                localStorage.removeItem('authorization-token');
                window.location.replace('index.html');
            }
        }
    );
} else {
    localStorage.removeItem('authorization-token');
    window.location.replace('index.html');
}

$(document).ready(function () {
    $('#event-name').html(app.eventName);

    $.ajax({
            url: config.baseUrl + '/api/event_management/current_round',
            type: 'GET',
            crossDomain: true,
        async: false,
            headers: {'Authorization': app.token},
            success: function (result) {
                if (result.status === 200) {
                    app.roundNumber = result.message;
                    $('#round-number').html('Send messages for round ' + (parseInt(app.roundNumber) + 1));
                } else {
                    localStorage.removeItem('authorization-token');
                    window.location.replace('index.html');
                }
            },
            error: function () {
                localStorage.removeItem('authorization-token');
                window.location.replace('index.html');
            }
        }
    );

    var source = $('#participant-template').html();
    app.template = Handlebars.compile(source);

    Handlebars.registerHelper('isReceived', function (smsStatus) {
        if (config.status.delivered.indexOf(smsStatus) > -1) {
            return 'success';
        } else if (config.status.error.indexOf(smsStatus) > -1) {
            return 'danger';
        } else if (config.status.pending.indexOf(smsStatus) > -1) {
            return 'info';
        } else {
            return '';
        }
    });

    var participantTable = $('#participant-table');
    var participantData = {participant: app.participant};

    for (var i = 0; i < participantData.participant.length; i++) {
        participantData.participant[i].index = i;
    }

    participantTable.html(app.template(participantData));

    if (app.roundNumber === '0') {
        var checkboxes = $('.checkbox');
        checkboxes.prop('checked', true);
        checkboxes.attr('disabled', true);
    }

    $('#add-team-modal').on('hidden.bs.modal', function () {
        var alertBox = $('#alert-add-team-modal');
        alertBox.addClass('sr-only');
        alertBox.html('');
    });

    $('#message-modal').on('hidden.bs.modal', function () {
        var alertBox = $('#alert-message-modal');
        alertBox.addClass('sr-only');
        alertBox.html('');
    });
});

function selectCheckboxes() {
    $('.checkbox').prop('checked', true);
}
function clearCheckboxes() {
    if (app.roundNumber !== '0') {
        $('.checkbox').prop('checked', false);
    }
}

function logOut() {
    localStorage.removeItem('authorization-token');
    window.location.replace('index.html');
}


function confirmAndSendMessage() {
    var venue = $('#venue-message-modal').val().trim();
    var dateTime = $('#date-time-message-modal').val().trim();

    var currentDate = new Date();
    var enteredDate = new Date(dateTime);

    if (venue && dateTime && (currentDate < enteredDate)) {
        $('#message-modal').modal('hide');

        dateTime = dateTime.split('T');
        var date = dateTime[0];
        var time = twentyFourHourToTwelveHour(dateTime[1]);

        var participants = [];
        $('.checkbox').each(function () {
            if ($(this).prop('checked')) {
                participants.push(app.participant[$(this).attr('u16-index')]);
            }
        });

        for (var i = 0; i < participants.length; i++) {
            delete participants[i]['smsStatus'];
            delete participants[i]['index'];
        }

        var parameters = {
            date: date,
            time: time,
            venue: venue,
            teams: participants,
            currentRound: app.roundNumber
        };

        $.ajax({
            url: config.baseUrl + '/api/event_management/promote',
            headers: {'Authorization': app.token},
            type: 'POST',
            data: JSON.stringify(parameters),
            dataType: 'json',
            crossDomain: true,
            success: function (result) {
                if (result.status === 200) {
                    setTimeout(reloadData, 10000);
                } else {
                    window.alert('Some error occurred.\nPlease try again.');
                }
            },
            error: function () {
                window.location.reload();
                }
            }
        );
    } else {
        var alertBox = $('#alert-message-modal');
        var message = 'Invalid input';
        if (!venue) {
            message = 'Please provide valid Venue';
        } else {
            message = 'Please provide valid date & time';
        }
        alertBox.html(message);
        alertBox.removeClass('sr-only');
    }
}
function confirmAndAddParticipant() {
    var names = $('#participant-names-add-team-modal').val().trim();
    var mobileNumber = $('#mobile-number-add-team-modal').val().trim();

    var mobileRegEx = /^[789][0-9]{9}$/;

    if (names && mobileRegEx.test(mobileNumber)) {
        $('#add-team-modal').modal('hide');

        $.ajax({
            url: config.baseUrl + '/api/event_management/participants',
            type: 'POST',
            data: JSON.stringify({
                names: names,
                mobileNumber: parseInt(mobileNumber),
                currentRound: app.roundNumber
            }),
            dataType: 'json',
            headers: {'Authorization': app.token},
            crossDomain: true,
            success: function (result) {
                if (result.status === 200) {
                    reloadData();
                } else {
                    window.alert('Some error occurred.\nPlease try again.');
                    reloadData();
                }
            },
            error: function () {
                    reloadData();
                }
            }
        );
    } else {
        var alertBox = $('#alert-add-team-modal');
        var message = '';
        if (!mobileRegEx.test(mobileNumber)) {
            message = 'Enter valid mobile number';
        } else {
            message = 'Names can\'t be blank';
        }
        alertBox.html(message);
        alertBox.removeClass('sr-only');
    }
}

function reloadData() {
    $.ajax({
            url: config.baseUrl + '/api/event_management/participants',
            type: 'GET',
            crossDomain: true,
            headers: {'Authorization': app.token},
            success: function (result) {
                if (result.status === 200) {
                    var participantData = result.message.participants;
                    app.eventName = result.message.eventName;

                    for (var i = 0; i < participantData.length; i++) {
                        participantData[i].names = participantData[i].names.replace(/\n/g, '<br />');
                    }

                    app.participant = participantData;

                    var source = $('#participant-template').html();
                    var template = Handlebars.compile(source);

                    var participantTable = $('#participant-table');
                    participantData = {participant: app.participant};

                    for (var i = 0; i < participantData.participant.length; i++) {
                        participantData.participant[i].index = i;
                    }

                    participantTable.html(template(participantData));

                    if (app.roundNumber === '0') {
                        var checkboxes = $('.checkbox');
                        checkboxes.prop('checked', true);
                        checkboxes.attr('disabled', true);
                    }
                } else {
                    localStorage.removeItem('authorization-token');
                    window.location.replace('index.html');
                }
            },
            error: function () {
                localStorage.removeItem('authorization-token');
                window.location.replace('index.html');
            }
        }
    );
    $.ajax({
            url: config.baseUrl + '/api/event_management/current_round',
            type: 'GET',
            crossDomain: true,
            async: false,
            headers: {'Authorization': app.token},
            success: function (result) {
                if (result.status === 200) {
                    app.roundNumber = result.message;
                    $('#round-number').html('Send messages for round ' + (parseInt(app.roundNumber) + 1));
                } else {
                    localStorage.removeItem('authorization-token');
                    window.location.replace('index.html');
                }
            },
            error: function () {
                localStorage.removeItem('authorization-token');
                window.location.replace('index.html');
            }
        }
    );
    if (app.roundNumber === '0') {
        var checkboxes = $('.checkbox');
        checkboxes.prop('checked', true);
        checkboxes.attr('disabled', true);
    }
}

function twentyFourHourToTwelveHour(twentyFourHour) {
    twentyFourHour = twentyFourHour.split(':');
    var hours = twentyFourHour[0];
    var minutes = twentyFourHour[1];
    var suffix = '';

    if (hours === 0) {
        suffix = 'AM';
        hours = '12';
    } else if (hours < 12) {
        suffix = 'AM';
    } else if (hours === 12) {
        suffix = 'PM';
    } else {
        suffix = 'PM';
        hours = hours - 12;
    }

    return hours + ':' + minutes + ' ' + suffix;
}