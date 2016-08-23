$(document).ready(function(e) {
    var messageNum = 0;

    // set up user list
    $.get('/users', function(data) {
        console.log('got ' + data);
        var baseUser = $('#user0');
        for (user in data) {
            var newUser = baseUser.clone();
            console.log('adding ' + user);
            newUser.attr('id', user);
            newUser.html(user);
            newUser.insertBefore(baseUser);
        }
    });
    
    // set up event stream to receive messages from server
    var source = new EventSource("/events/");
    source.onmessage = function(e) {
        if (messageNum === Number.MAX_SAFE_INTEGER) {
            console.log('uh oh');  // probably won't ever happen
        }
        var data = JSON.parse(e.data);
        var prevLine = $('#line' + messageNum);
        var newLine = prevLine.clone();
        console.log('line id ' + prevLine.attr('id'));
        newLine.attr('id', 'line' + (++messageNum));
        console.log('id ' + newLine.attr('id'));
        newLine.find(".message").html(data.message);
        newLine.find(".time").html(data.time);
        newLine.find(".name").html(data.name);
        newLine.insertAfter(prevLine);
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
