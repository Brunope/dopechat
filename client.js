$(document).ready(function(e) {

    // event stream
    var source = new EventSource("/events/");
    source.onmessage = function(e) {
	console.log('adding' + e);
        var data = JSON.parse(e.data);
        console.log('got ' + data);
	$("#container").append(data.time + ": &nbsp" + data.message + "<br>");
    };

    // ajax form submission
    $("form[ajax=true]").submit(function(e) {
        e.preventDefault();
        var form_data = $(this).serialize();
        var form_url = $(this).attr("action");
        var form_method = $(this).attr("method").toUpperCase();
        $.ajax({
            url: form_url, 
            type: form_method,      
            data: form_data,     
            cache: false,
            success: function(returnhtml){
                console.log('got ' + returnhtml);
                return true;
            }           
        });
        // clear form after
        $('input[type="text"], textarea').val('');
    });
});
