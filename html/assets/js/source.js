(function($) {

    var tableData; var resList; var selectData; var allData; var selectRow;
    console.log("hi");
    $(function() {

        $.ajax({
            type: 'GET',
            url: $SCRIPT_ROOT + "/source_list",
            contentType: 'application/json',
            dataType: "json",
            async: false,
            success: function(data) {
                res = data.result;
                var len = res.length;
                for (var i = 0; i < len; i++) {
                    var val = res[i];
                    $("#sources").append(
                        $("<li>").append(val)
                    );
                }
            },
            error: function(ts) {
                alert(ts.responseText);
            }
        });

        $("#sources li").on("click", function() {
            $("#sources li").off("click");
            var sourceName = $(this).text().trim();
            window.sessionStorage.setItem("sName", sourceName);
            document.location.href = ("/collector/sour_res");
        });
    });

})(jQuery);
