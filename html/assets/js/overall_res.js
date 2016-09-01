(function($) {
    var link; var yLabel; var xLabel; var title;
    $(function() {
        var result = "failed";
        var overallName = window.sessionStorage.getItem("oName");
        link = window.sessionStorage.getItem("link");
        title = window.sessionStorage.getItem("title");
        yLabel = window.sessionStorage.getItem("yLabel");
        xLabel = window.sessionStorage.getItem("xLabel");
        $("#loadText").fadeIn(function() {
            $.ajax({
                type: 'POST',
                url: $SCRIPT_ROOT + "/overall_data",
                data: JSON.stringify({toGet:overallName}),
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
                                xLabel, yLabel, title);
                    $("#dataVis").append(
                        $("<div>").append(
                            $("<ul>").append(
                                        $("<li>").append(
                                            $("<a>").append("Back")
                                                    .attr("href", 
                                                            "/collector/over")
                                                    .attr("class",
                                                            "button scrolly")
                                        )
                                    )
                                    .attr("class","actions")
                            )
                        )
                    $("#loadText").fadeOut();
                },
                error: function(ts) {
                    alert(ts.responseText);
                }
            });
        });
    });

    $(window).resize(function () {
        $("#dataVis").html("");
        graphResults(resDict, resList, "overall", xLabel, yLabel, title);
    });

})(jQuery);