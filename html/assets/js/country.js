
(function($) {

	var tableData; var resList; var selectData; var allData; var selectRow;

	$(function() {

		//call server scripts
		$.ajax({
			type: 'GET',
			url: $SCRIPT_ROOT + "/country_list",
			contentType: 'application/json',
			dataType: "json",
			async: false,
			success: function(data) {
				res = data.result;
				var len = res.length;
				for (var i = 0; i < len; i++) {
					var val = res[i];
					var letter = val.charAt(0)
					var section = ("#").concat(letter)
					$(section).append(
						$("<li>").append(val)
					);
				}
			},
			error: function(ts) {
				alert(ts.responseText);
			}
		});

		$(".countries li").on("click", function() {
			$(".countries li").off("click");
			var countryName = $(this).text().trim();
			var result = "failed";

			$(".inner > h1").fadeOut();
			$("#countryList").fadeOut(function() {
				$("#loadText").fadeIn(function() {
					$.ajax({
						type: 'POST',
						url: $SCRIPT_ROOT + "/country_data",
						data: JSON.stringify({cname:countryName}),
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
								console.log(res);
								$("#dataRes").fadeIn();
								$("#dataVis").fadeIn();
								$("#back").fadeIn();
								makeTable(tableData, resList, selectData,
											"Sources", "Source");
								graphResults(allData, resList, "all",
											"# of URLs", "Capture results",
											"Results Across All Sources");
								$("#dataRes h1").html(countryName);
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
