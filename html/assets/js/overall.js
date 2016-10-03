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

            window.sessionStorage.setItem("oName", send);
            window.sessionStorage.setItem("link", link);
            window.sessionStorage.setItem("title", title);
            window.sessionStorage.setItem("yLabel", yLabel);
            window.sessionStorage.setItem("xLabel", xLabel);
        });
    });

})(jQuery);