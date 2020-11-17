$('#login').click(function() {
	const username = $('#username').val();
	const password = $('#password').val();

	if (username && password) {
		$.post('/api/auth/', {
			username,
			password
		}, function(res) {
			location.reload();
		}).fail(function() {
			$('#username').val('');
			$('#password').val('');
			$('#username').focus();
			$('#login-fail').slideDown();
			setTimeout(function() {
				$('#login-fail').slideUp();
			}, 5000);
		});
	}
});

$(document).on('keypress',function(e) {
	if (e.which == 13) {
		$('#login').click();
	}
});