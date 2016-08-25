(function($) {

    var tableData; var resList; var selectData; var allData; var selectRow;

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

        $(".sources li").on("click", function() {
            $(".sources li").off("click");
            var sourceName = $(this).text().trim();
            var result = "failed";

            $(".inner > h1").fadeOut();
            $("#sourceList").fadeOut(function() {
                $("#loadText").fadeIn(function() {
                    $.ajax({
                        type: 'POST',
                        url: $SCRIPT_ROOT + "/source_data",
                        data: JSON.stringify({sname:sourceName}),
                        contentType: 'application/json',
                        dataType: "json",
                        async: false,
                        success: function(data) {
                            try {
                                res = data.result;
                                tableData = res[0];
                                resList = res[1];
                                selectData = res[2];
                                allData = res[3];
                                console.log(res[0]);
                                console.log(res[1]);
                                console.log(res[2]);
                                console.log(res[3]);
                                $("#dataRes").fadeIn();
                                $("#dataVis").fadeIn();
                                $("#back").fadeIn();
                                makeTable(tableData, resList, selectData,
                                            "Countries", "Country");
                                graphResults(allData, resList, "all", 
                                            "# of URLs", "Capture results",
                                            "Results Across All Countries");
                                $("#dataRes h1").html(sourceName);
                                $("#loadText").fadeOut();
                                return;
                            } catch(err) {
                                $("#loadText").fadeOut();
                                $("#dataRes").html(err.message);
                                $("#dataRes").fadeIn();
                                $("#dataVis").fadeIn();
                                $("#back").fadeIn();
                                return;
                            }
                        },
                        error: function(ts) {
                            alert(ts.responseText);
                            return;
                        }
                    });
                });
            });
        });

        $(window).resize(function () {
            $("#dataSel").html("");
            $("#dataVis").html("");
            if (typeof(selectRow) != "undefined") {
                graphResults(selectRow, resList, "sel");
            }
            graphResults(allData, resList, "all");
        });
    });

})(jQuery);
