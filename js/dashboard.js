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
                    $('#round-number').html('Round: ' + app.roundNumber);
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
        if (smsStatus === config.status.delivered) {
            return 'success';
        } else if (smsStatus === config.status.error) {
            return 'danger';
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

    // On venue or date-time change
    $('#venue-message-modal, #date-time-message-modal').on('change', function () {
            var venue = $('#venue-message-modal').val();
            var dateTime = $('#date-time-message-modal').val();
            if (venue && dateTime) {
                dateTime = dateTime.split('T');
                var date = dateTime[0];
                var time = dateTime[1];
                $('#message-message-modal').val("Your next round will be at " + venue + " on " + time + ', ' + date);
            }
        }
    );
});

function selectCheckboxes() {
    $('.checkbox').prop('checked', true);
}
function clearCheckboxes() {
    $('.checkbox').prop('checked', false);
}

function logOut() {
    localStorage.removeItem('authorization-token');
    window.location.replace('index.html');
}


function confirmAndSendMessage() {
    $('#message-modal').modal('hide');
    $('#confirm-send-message-modal').modal('hide');

    var venue = $('#venue-message-modal').val();
    var dateTime = $('#date-time-message-modal').val();
    dateTime = dateTime.split('T');
    var date = dateTime[0];
    var time = dateTime[1];

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
        teams: participants
    };

    $.ajax({
        url: config.baseUrl + '/api/sendsms',
            headers: {'Authorization': app.token},
            type: 'POST',
            data: JSON.stringify(parameters),
            dataType: 'json',
            crossDomain: true,
            success: function (result) {
                if (result.status === 200) {
                    setTimeout(reloadData, 5000);
                } else {
                    window.alert('Some error occurred.\nPlease try again.');
                }
            },
        error: function () {
            window.location.reload();
            }
        }
    );
}
function confirmAndAddParticipant() {
    $('#add-team-modal').modal('hide');
    $('#confirm-add-team-modal').modal('hide');

    var names = $('#participant-names-add-team-modal').val();
    var mobileNumber = $('#mobile-number-add-team-modal').val();

    $.ajax({
        url: config.baseUrl + '/api/event_management/participants',
            type: 'POST',
            data: JSON.stringify({
                names: names,
                mobileNumber: mobileNumber
            }),
            dataType: 'json',
            headers: {'Authorization': app.token},
            crossDomain: true,
        success: function (result) {
            if (result.status === 200) {
                reloadData();
            } else {
                window.alert('Some error occurred.\nPlease try again.');
            }
            },
            error: function () {
                reloadData();
            }
        }
    );
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
}