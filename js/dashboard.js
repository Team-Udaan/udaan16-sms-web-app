/**
 * Created by Binny Gandhi on 15-03-2016.
 */

var app = {};

app.token = localStorage.getItem('authorization-token');
if (app.token) {
    $.ajax({
            url: 'http://ec2-52-32-39-143.us-west-2.compute.amazonaws.com:8001/api/event_management/participants',
            type: 'GET',
            crossDomain: true,
            async: false,
            headers: {'Authorization': app.token},
            success: function (result) {
                if (result.status === 200) {
                    var participantData = result.message;

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

    var source = $('#participant-template').html();
    var template = Handlebars.compile(source);

    var participantTable = $('#participant-table');
    var participantData = {participant: app.participant};
    for (var i = 0; i < participantData.participant.length; i++) {
        participantData.participant[i].index = i;
    }
    participantTable.html(participantTable.html() + template(participantData));

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
        participants[i].id = participants[i]._id;
        delete participants[i]['_id'];
        participants[i].receipt_id = participants[i].receiptId;
        delete participants[i]['receiptId'];
    }

    var parameters = {
        date: date,
        time: time,
        venue: venue,
        teams: participants
    };

    $.ajax({
            url: 'http://ec2-52-32-39-143.us-west-2.compute.amazonaws.com:8001/api/sendsms',
            headers: {'Authorization': app.token},
            type: 'POST',
            data: JSON.stringify(parameters),
            dataType: 'json',
            crossDomain: true,
            success: function (result) {
                window.location.reload();
            },
            error: function (error) {
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
            url: 'http://ec2-52-32-39-143.us-west-2.compute.amazonaws.com:8001/api/event_management/participants',
            type: 'POST',
            data: JSON.stringify({
                names: names,
                mobileNumber: mobileNumber
            }),
            dataType: 'json',
            headers: {'Authorization': app.token},
            crossDomain: true,
            success: function () {
                window.location.reload();
            },
            error: function () {
                window.location.reload();
            }
        }
    );
}