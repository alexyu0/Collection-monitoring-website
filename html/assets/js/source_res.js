(function($) {

    var tableData; var resList; var selectData; var allData; var selectRow;
    var sourceName;
    var sizeNo;

    $(function() {
        var result = "failed";
        var sourceName = window.sessionStorage.getItem("sName");
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
                        sourceName = res[4];
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
                        makeTable(tableData, resList, selectData,
                                    "Countries", "Country");
                        graphResults(allData, resList, "all", 
                                    "# of URLs", "Capture results",
                                    "Results Across All Countries",sizeNo);
                        $("#back").append(
                            $("<div>").append(
                                $("<ul>").append(
                                            $("<li>").append(
                                                $("<a>").append("Back")
                                                        .attr("href", 
                                                            "/collector/sour")
                                                        .attr("class",
                                                            "button scrolly")
                                            )
                                        )
                                        .attr("class","actions")
                                )
                            )
                        $("#dataRes h1").html(sourceName);
                        $("#loadText").css("display", "none");
                        return;
                    } catch(err) {
                        $("#loadText").css("display", "none");
                        $("#dataRes").html(err.message);
                        $("#dataRes").css("display", "block");
                        $("#dataVis").css("display", "block");
                        $("#back").css("display", "block");
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

    $(window).resize(function () {
        $("#dataSel").html("");
        $("#dataVis").html("");
        var title;
        $("#dataTable tr").each(function() {
            if ($(this).attr("chosen") == "true") {
                var rowText = $(this).html() 
                var start = rowText.indexOf("<td>") + 4;
                var end = rowText.indexOf("</td>");
                var rowCountry = rowText.substring(start,end);
                selectRow = selectData[rowCountry];
                title = "Results for URLs from " + rowCountry;
            }
        });
        if ($(window).width() <= 620) {
            sizeNo = 2
        } else if ($(window).width() <= 800) {
            sizeNo = 1;
        } else {
            sizeNo = 0;
        }
        if (typeof(selectRow) != "undefined") {
            graphResults(selectRow, resList, "sel", "# of URLs", 
                        "Capture results", title, sizeNo);
        }
        graphResults(allData, resList, "all", "# of URLs", 
                    "Capture results", "Results Across All Countries", sizeNo);
    });

})(jQuery);
