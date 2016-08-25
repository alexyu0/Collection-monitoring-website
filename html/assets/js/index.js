(function($) {
    $(function() {
        console.log("ajax call")
        $.ajax({
            type: 'GET',
            url: $SCRIPT_ROOT + "/collector_monitor",
            dataType: "json",
            async: false,
            success: function(data) {
                console.log(data);
                for (var i = 0; i < ((data.result[0]).length); i++) {
                    $("#monitor").append(
                        $("<li>").append((data.result[0])[i])
                    );
                }
                console.log(data.result[1])
            },
            error: function(ts) {
                alert(ts.responseText);
            }
        });
    });
})(jQuery);