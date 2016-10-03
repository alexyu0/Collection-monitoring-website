
(function($) {
    setInterval(update, 100);
    $('p').css({"color":"green"});
    $(function update() {
        $.ajax({
            type = 'GET',
            url = '../python/currentActivity.py',
            datatype = 'plain text',
            success: function(response) {
                $('#progress').css({"content":"asdfasdf"});
            }
        });
    });
})(jQuery);