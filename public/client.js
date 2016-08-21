$(document).ready(function(e) {
    var messageNum = 0;
    
    // event stream
    var source = new EventSource("/events/");
    source.onmessage = function(e) {
        var data = JSON.parse(e.data);
        var line = $("#line");
        var newLine = line.clone();
        newLine.id = line.id + messageNum++;
        newLine.find(".message").html(data.message);
        newLine.find(".time").html(data.time);
        newLine.find(".name").html(data.name);
        newLine.insertBefore($("#msgForm"));
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
