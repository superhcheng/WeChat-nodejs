var client_socket = io();
var messageList = $('#message-list');
var userList = $('#user-list');
var chatSideBar = $('#chat-sidebar');
var crd = null;
var update_userlist_template = $('#room-template').html();

var currentUser = {};

function autoScroll() {
    var list = $('#message-list');
    var lastLi = list.children('li:last-child');
    if (parseInt(list.prop('clientHeight')) + parseInt(list.prop('scrollTop')) + parseInt(lastLi.innerHeight()) + parseInt(lastLi.prev().innerHeight()) >= parseInt(list.prop('scrollHeight'))) {
        // console.log('Yes: ' + scrollNumA + ' Condition Value: ' + scrollNumB);
        list.scrollTop(parseInt(list.prop('scrollHeight')));
    }
}

if ('geolocation' in navigator) {
    console.log('Current Device Support Geo Location Service');

    var geo_options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }

    function geo_success(pos) {
        crd = pos.coords;
        // console.log('Your current position is:');
        // console.log(`Latitude : ${crd.latitude}`);
        // console.log(`Longitude: ${crd.longitude}`);
        // console.log(`More or less ${crd.accuracy} meters.`);
    }

    function geo_error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }
    navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
    // console.log(crd);
} else {
    alert('Current Device does NOT Support Geo Location Service');
}

client_socket.on('connect', function() {
    console.log("Client: Connect to Server");
    var params = paramStrToObject(window.location.search.toString());
    client_socket.emit('join', params, function(err) {
        if (err) {
            window.location.href = '/';
        } else {
            // console.log("Client: Join Successfully");
            currentUser = params;
            document.title = 'Talking in ' + currentUser.room_name;
            // history.replaceState('', 'Topic: ' + currentUser.room_name, document.location.href.substring(0, (document.location.href.indexOf("?") - 5 )));
            history.replaceState('', '' + currentUser.room_name, document.location.href.substring(0, (document.location.href.indexOf("?") - 9 )));

        }
    });
});

client_socket.on('disconnect', function() {
    console.log("Client: Disconnect from Server");
    // console.log("Client Socket: " , client_socket);
});

// Custom Socket Event Listener   --- Start


client_socket.on('server_notification', function(server_notification_response) {
    // console.log('Client Received: From: ' + server_notification_response.from + ' Text: ' + server_notification_response.text );
    var formatedTime = moment(server_notification_response.createdAt).format('MMM Do YYYY, h:mm:ss a');
    var template = $('#notification-template').html();
    var html = Mustache.render(template, {
        from: server_notification_response.from,
        text: server_notification_response.text,
        createdAt: formatedTime
    });
    messageList.append(html);
    autoScroll();
    /*
    var formatedTime = moment(server_notification_response.createdAt).format('h:mm a');
    messageList.append(`<li><span>${server_notification_response.from} ${formatedTime}: ${server_notification_response.text}</span></li>`);
    */
});


client_socket.on('new_location', function(new_server_location_response) {
    // console.log('Client Received: From: ' + new_server_location_response.from + ' Geo URL: ' + new_server_location_response.locationURL );
    var formatedTime = moment(new_server_location_response.createdAt).format('h:mm a');
    var template = $('#location-template').html();
    var html = Mustache.render(template, {
        from: new_server_location_response.from,
        locationURL: new_server_location_response.locationURL,
        gmapsAPIKEY: 'AIzaSyCJfDEwdIb-kK69Vk_1aXXeEMrBKkaUTs4',
        locationGEO: new_server_location_response.locationGEO,
        createdAt: formatedTime
    });
    messageList.append(html);
    autoScroll();
    /*
    var formatedTime = moment(new_server_location_response.createdAt).format('h:mm a');
    messageList.append(`<li><span>${new_server_location_response.from} ${formatedTime}</span> : <a target="_blank" href="${new_server_location_response.locationURL}">Geo Location</a></li>`);
    */
});

client_socket.on('new_message', function(new_message) {
    var formatedTime = moment(new_message.createdAt).format('h:mm a');
    var template = $('#message-template').html();
    var html = Mustache.render(template, {
        from: new_message.from,
        text: new_message.text,
        createdAt: formatedTime
    });
    messageList.append(html);
    autoScroll();
    // console.log('Client Received: From: ' + new_message.from + ' Geo URL: ' + new_message.text );
    /*
    var formatedTime = moment(new_message.createdAt).format('h:mm a');
    messageList.append(`<li><span>${new_message.from} ${formatedTime}: ${new_message.text}</span></li>`);
    */
    // callback('new_message: Client 200');
});

// userList = $('#user-list');
// chatSideBar = $('#chat-sidebar');
/*
<div id="chat-sidebar" class="chat__sidebar">
  <script id="room-template" type="text/template">
    <h3>{{room_name}}</h3>
    <div id="users">
      <ol id="user-list">
      </ol>
    </div>
  </script>
</div>
*/

client_socket.on('update_userlist', function(updatedUserList) {
    // console.log('Client update_userlist Triggered', updatedUserList);
    chatSideBar.html('');

    // console.log('Client update_userlist template', update_userlist_template);
    var html = Mustache.render(update_userlist_template,{
      room_name: currentUser.room_name,
      room_user_list: updatedUserList
    });
    // console.log('Client html template', html);
    //$('#room-template').empty();

    chatSideBar.append(html);
});


// client_socket.on('new_user', function(new_user){
//   console.log('Client Received: From: ' + new_user.from + ' Text: ' + new_user.text );
// });
// Custom Socket Event Listener   --- End



$('#message-form').on('submit', function(event) {
    // alert($('#input_message').val());
    var textBox = $('#input_message');
    event.preventDefault();
    if (textBox.val() == '' || textBox.val() == null) {
        return;
    }
    client_socket.emit('new_message', {
        from: currentUser.user_name,
        text: textBox.val()
    }, function(serverStatus) {
        textBox.val('');
        // alert('Client new_message: ' + serverStatus);
        // messageList.append(`<li><a href="."><span>${$('#input_message').val()}</span></a></li>`);
    });
});

$('#btn-send-location').on('click', function(event) {
    var geoButton = $('#btn-send-location');
    // console.log(geoButton);
    if (crd) {
        geoButton.attr('disabled', true).text('Sending......');
        client_socket.emit('new_location', {
            from: currentUser.user_name,
            la: crd.latitude,
            lo: crd.longitude
        }, function(serverStatus) {
            geoButton.attr('disabled', false).text('Share Geo Location');
            // alert('Client new_location: ' + serverStatus);
        });
    } else {
        return alert('Geo Location Unavailable');
    }
});
