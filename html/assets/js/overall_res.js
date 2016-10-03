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
                    $("#dataRes").css("display", "block");
                    $("#dataVis").css("display", "block");
                    $("#back").css("display", "block");
                    if ($(window).width() <= 620) {
                        sizeNo = 2
                    } else if ($(window).width() <= 800) {
                        sizeNo = 1;
                    } else {
                        sizeNo = 0;
                    }
                    graphResults(resDict, resList, "overall", 
                                xLabel, yLabel, title, sizeNo);
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
                    $("#loadText").css("display", "none");
                },
                error: function(ts) {
                    alert(ts.responseText);
                }
            });
        });
    });

    $(window).resize(function () {
        $("#dataVis").html("");
        if ($(window).width() <= 620) {
            sizeNo = 2
        } else if ($(window).width() <= 800) {
            sizeNo = 1;
        } else {
            sizeNo = 0;
        }
        graphResults(resDict, resList, "overall", xLabel, yLabel, title, 
                        sizeNo);
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
    });

})(jQuery);