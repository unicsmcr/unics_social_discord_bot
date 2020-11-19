function apiErrors(status) {
	if (status == 400) {
		alert("A bad request was made. Please refresh the page and retry.");
	}
	else if (status == 401) {
		alert("Your session has expired. Please refresh the page, log in and retry.");
	}
	else {
		alert("Something has gone wrong. Please try again later.");
	}
	location.reload();
}

$(document).ready(function() {
	$.get('/api/events/', function(res) {
		if (res.length > 0) {
			res.forEach(function(event) {
				var channels = event.options,
					launch;
				if (event.options == 'textvoice') {
					channels = 'Text & Voice'
				}

				if (event.assigned) {
					launch = `<button type="button" class="btn btn-secondary" disabled>Event Launched</button>`;
				}
				else {
					launch = `<button type="button" class="btn btn-primary" data-id="${ event._id }"} data-toggle="modal" data-target="#launchEventModal">Launch Event</button>`;
				}

				$('tbody').append(`
					<tr>
						<td class="align-middle">${ event.name }</td>
						<td class="align-middle" style="text-transform: capitalize;">${ channels }</td>
						<td class="align-middle">
							${ launch }
							<button type="button" class="btn btn-danger" data-id="${ event._id }"} data-toggle="modal" data-target="#deleteEventModal">Delete Event</button>
						</td>
					</tr>`);
			});
		}
		else {
			$('tbody').append(`
				<tr class="text-center">
					<td colspan="3"><em>No events found.</em></td>
				</tr>
				`);
		}
	}).fail(function(error) {
		apiErrors(error.status);
	});
});

$('#addEventModalSave').click(function() {
	const name = $('#eventName').val();
	if (!name) {
		$('#eventName').addClass('is-invalid');
		setTimeout(function() {
			$('#eventName').removeClass('is-invalid');
		}, 5000);
	}
	const description = $('#eventDescription').val();
	const channels = $('#eventChannels').val();
	
	if (name && channels) {
		$('#addEventModalSpinner').show();
		$.post('/api/event', {
			name,
			description,
			channels
		}, function(res) {
			location.reload();
		}).fail(function(error) {
			apiErrors(error.status);
		});
	}
});

$('#addEvent').click(function() {
	$('#eventName').val('');
	$('#eventDescription').val('');
	$('#eventChannels').val('textvoice');
	$('#addEventModalSpinner').hide();
});

$(document).delegate('tbody .btn-primary', 'click', function() {
	$('#launchEventModalConfirm').data("id", $(this).data("id"));
	$('#eventGroupsFixed').prop('checked', true);
	$('#eventGroupsVariable').prop('checked', false);
	$('#eventGroupsVariableInput').attr('disabled', true);
	$('#eventGroupsVariableInput').removeClass('is-invalid');
	$('#eventGroupsVariableInput').val(null);
	$('#eventGroupsFixedInput').attr('disabled', false);
	$('#eventGroupsFixedInput').val(null);
});

$('#eventGroupsFixed, #eventGroupsVariable').change(function() {
	if ($('#eventGroupsFixed').is(':checked')) {
		$('#eventGroupsVariableInput').attr('disabled', true);
		$('#eventGroupsVariableInput').removeClass('is-invalid');
		$('#eventGroupsVariableInput').val(null);
		$('#eventGroupsFixedInput').attr('disabled', false);
	}
	if ($('#eventGroupsVariable').is(':checked')) {
		$('#eventGroupsVariableInput').attr('disabled', false);
		$('#eventGroupsFixedInput').attr('disabled', true);
		$('#eventGroupsFixedInput').removeClass('is-invalid');
		$('#eventGroupsFixedInput').val(null);
	}
});

$('#launchEventModalConfirm').click(function() {
	const id = $(this).data('id');
	var method, groups, size;

	if ($('#eventGroupsFixed').is(':checked')) {
		method = 'fixed';
		groups = $('#eventGroupsFixedInput').val();
		if (!groups) {
			$('#eventGroupsFixedInput').addClass('is-invalid');
			setTimeout(function() {
				$('#eventGroupsFixedInput').removeClass('is-invalid');
			}, 5000);
			return;
		}
	}
	if ($('#eventGroupsVariable').is(':checked')) {
		method = 'variable';
		size = $('#eventGroupsVariableInput').val();
		if (!size) {
			$('#eventGroupsVariableInput').addClass('is-invalid');
			setTimeout(function() {
				$('#eventGroupsVariableInput').removeClass('is-invalid');
			}, 5000);
			return;
		}
	}
	
	$.ajax({
		url: '/api/event/' + id,
		type: 'PUT',
		data: {
			method,
			groups,
			size
		},
		success: function(res) {
			location.reload();
		},
		error: function(error) {
			apiErrors(error.status);
		}
	});
});

$(document).delegate('tbody .btn-danger', 'click', function() {
	$('#deleteEventModalConfirm').data("id", $(this).data("id"));
});

$('#deleteEventModalConfirm').click(function() {
	$.ajax({
	    url: '/api/event/' + $(this).data('id'),
	    type: 'DELETE',
	    success: function(res) {
	        location.reload();
	    },
		error: function(error) {
			apiErrors(error.status);
		}
	});
});

$('#logout').click(function() {
	$.ajax({
	    url: '/api/auth/',
	    type: 'DELETE',
	    success: function(res) {
	        location.reload();
	    },
		error: function(error) {
			apiErrors(error.status);
		}
	});	
});