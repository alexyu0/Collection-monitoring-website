
(function($) {
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
						$("<li>").append(
							$("<a>").append(val)
									.attr("href",
										("/collector/coun_res/").concat(val))
								)
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
            window.sessionStorage.setItem("cName", countryName);
        });
	});

})(jQuery);
