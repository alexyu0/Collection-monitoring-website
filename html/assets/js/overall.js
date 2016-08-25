(function($) {
    $(function() {

        $(".dataLink li").on("click", function() {
            $(".dataLink li").off("click");
            var link = $(this).text().trim();
            var send; var title; var yLabel; var xLabel;
            if (link.indexOf("Average") > -1) {
                send = "avg";
                title = "Averaged Results Across All Countries and Sources";
                yLabel = "Capture results";
                xLabel = "# of URLs";
            } else if (link.indexOf("Countries") > -1) {
                send = "countries";
                title = "Percentage of OK URLs";
                yLabel = "Countries";
                xLabel = "% of URLs";
            } else {
                send = "sources";
                title = "Percentage of OK URLs";
                yLabel = "Sources";
                xLabel = "% of URLs";
            }
            var result = "failed";

            $(".inner > h1").fadeOut();
            $(".dataLink").fadeOut(function() {
                $("#loadText").fadeIn(function() {
                    $.ajax({
                        type: 'POST',
                        url: $SCRIPT_ROOT + "/overall_data",
                        data: JSON.stringify({toGet:send}),
                        contentType: 'application/json',
                        dataType: "json",
                        async: false,
                        success: function(data) {
                            res = data.result;
                            console.log(res);
                            resDict = res[0];
                            resList = res[1];
                            $("#dataRes h1").html(link);
                            $("#dataRes").fadeIn();
                            $("#resList").fadeIn();
                            $("#dataVis").fadeIn();
                            graphResults(resDict, resList, "overall", 
                                        "# of URLs", yLabel, title);
                            $("#loadText").fadeOut();
                        },
                        error: function(ts) {
                            alert(ts.responseText);
                        }
                    });
                });
            });
        });
    });

})(jQuery);