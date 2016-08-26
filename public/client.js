$(document).ready(function(e) {

    // style that I can't figure out how to do in css
    var sizeHandler = function() {
        $('#messageContainer').height($('#container').height() -
                                      $('#msgForm').height());
    };
    sizeHandler();
    $(window).resize(sizeHandler);

    scrollToBottom = function () {
        var relative = document.getElementById('messageContainer');
        relative.scrollTop = relative.scrollHeight;
    };
    scrollToBottom();
    
    // set up user list
    function updateUsers() {
        $.get('/users', function(users) {
            // delete all users, then reinsert all connected users;
            // ineffecient but robust.
            console.log('got ' + users);
            var currentUsers = $('.user');
            for (var i = 0; i < currentUsers.length; i++) {
                if (currentUsers[i].id !== 'user0') {
                    currentUsers[i].remove();
                }
            }
            var baseUser = $('#user0');  // dummy invis user we clone
            var user;
            var newUser;
            for (var i = 0; i < users.length; i++) {
                user = users[i]
                newUser = baseUser.clone();
                newUser.attr('id', user);
                newUser.html(user);
                newUser.insertBefore(baseUser);
            }
        });
        return;
    }
    updateUsers();

    var messageNum = 0;
    // set up event stream to receive messages from server
    var source = new EventSource('/events/');
    source.onmessage = function(e) {
        if (messageNum === Number.MAX_SAFE_INTEGER) {
            console.log('uh oh');  // probably won't ever happen
        }
        var data = JSON.parse(e.data);
        console.log('data: ' + data.name);
        var prevLine = $('#line' + messageNum);
        var newLine = prevLine.clone();
        console.log('line id ' + prevLine.attr('id'));
        newLine.attr('id', 'line' + (++messageNum));
        console.log('id ' + newLine.attr('id'));
        newLine.find('.message').html(data.message);
        newLine.find('.time').html(data.time);
        newLine.find('.name').html(data.name);
        if (data.name === '') {  // system user = ''
            console.log('user event ' + data.name);
            updateUsers();
            if (data.message.endsWith(' joined')) {  // user just joined
                newLine.find('.message').html(' joined');
                newLine.find('.name').html(
                    data.message.substring(0, data.message.indexOf(' joined')));
            } else if (data.message.endsWith(' left')) {  // user just left
                newLine.find('.message').html(' left');
                newLine.find('.name').html(
                    data.message.substring(0, data.message.indexOf(' left')));
            } else {
                console.log('weeeeeird');
            }
            newLine.addClass('system');
        }
        newLine.insertAfter(prevLine);
        scrollToBottom();
    };

    // ajax form submission
    $("form[ajax=true]").submit(function(e) {
        e.preventDefault();
        console.log('sending message');
        var form_data = $(this).serialize();
        var form_url = $(this).attr("action");
        var form_method = $(this).attr("method").toUpperCase();
        $.ajax({
            url: form_url,
            type: form_method,
            data: form_data,
            cache: false,
            success: function(returnhtml) {
                return true;
            }
        });
        // clear form after
        $('input[type="text"], textarea').val('');
    });
});
