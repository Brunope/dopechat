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
    $.get('/users', function(data) {
        console.log('got ' + users);
        var baseUser = $('#user0');
        for (var i = 0; i < data.length; i++) {
            let user = data[i];
            console.log('adding user ' + user);
            var newUser = baseUser.clone();
            console.log('adding ' + user);
            newUser.attr('id', user);
            newUser.html(user);
            newUser.insertBefore(baseUser);
        }
    });

    var messageNum = 0;
    // set up event stream to receive messages from server
    var source = new EventSource("/events/");
    source.onmessage = function(e) {
        if (messageNum === Number.MAX_SAFE_INTEGER) {
            console.log('uh oh');  // probably won't ever happen
        }
        var data = JSON.parse(e.data);
        console.log('data: ' + data.name);
        if (data.name === '') {  // system user = ''
            console.log('user event');
            // update user list if system sent a user event
            let index = data.message.indexOf(' joined');
            if (index > 0) {
                var userName = data.message.substring(0, index);
                let user = $('#' + userName);
                if (user.length === 0) {
                    let newUser = $('#user0').clone();
                    newUser.attr('id', userName);
                    newUser.html(userName);
                    newUser.insertAfter($('#user0'));
                    data.message = ' joined';
                }
            } else {
                index = data.message.indexOf(' left');
                if (index > 0) {
                    $('#' + data.message.substring(0, index)).remove();
                    data.message = ' left';
                }
            }
            data.name = userName;
        }
        var prevLine = $('#line' + messageNum);
        var newLine = prevLine.clone();
        console.log('line id ' + prevLine.attr('id'));
        newLine.attr('id', 'line' + (++messageNum));
        console.log('id ' + newLine.attr('id'));
        newLine.find(".message").html(data.message);
        newLine.find(".time").html(data.time);
        newLine.find(".name").html(data.name);
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
