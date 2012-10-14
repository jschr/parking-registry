(function(){
	function getRandomStreetNumber(e){
		e.preventDefault();

		var number = +$('#streetnumber input').val(),
			spread = +$('#streetnumber-spread').val();

		$('#streetnumber-value input').val(number + (Math.floor(Math.random() * spread * 2) - spread));
	}

	function drawProfiles(){
		for (var key in config.store) {
			var $parent = $('#' + key + '-fields .nav').empty();
			for (var field in config.store[key]) {
				$('<li><a href="#">' + field + '</a></li>')
					.appendTo($parent)
					.find('a')
					.data('bindings', JSON.stringify(config.store[key][field]));
			}
		}
	}

	var loadStore = function(){
		return JSON.parse(localStorage.store || '{ "car":{}, "address":{} }');
	}

	var config = {
		store: loadStore(),
		selectors: {
			makes: '[id$="VehicleMake"]',
			model: '[id$="CarModelAdd"]',
			colour: '[id$="CarColourNew"]',
			plate: '[id$="LicPlateNew"]',
			firstname: '[id$="FirstName"]',
			lastname: '[id$="LastName"]',
			streetnumber: '#streetnumber input',
			'streetnumber-value': '[id$="StrNumber"]',
			streetname: '[id$="StrName"]',
			streetsame: '[id$="StrSame"]',
			phone: '[id$="Phone"]',
			email: '[id$="Email"]',
			date: '[id$="FromDate"]',
			nights: '[id$="NumberOfNights"]',
			reason: '[id$="ddlReason"]',
			addVehicle: '[id$="btnAdd"]',
			requestPermit: '[id$="btnRequest"]',
		}
	}

	$(function(){

		var $contents;

		$('.save').on('click', function(e){
			var key = $(this).data('key'),
				$fieldset = $(this).closest('fieldset');
				name = prompt('Name: ');

			if (!name) return;
			
			config.store[key][name] = {};

			for (var field in config.selectors){
				var $element = $fieldset.find(config.selectors[field]);
				config.store[key][name][field] = $element.val();
			}

			localStorage.store = JSON.stringify(config.store);

			drawProfiles();
		});

		$('.nav').on('click', 'li a', function(e){
			e.preventDefault();

			var $this = $(this);

			$this.closest('.nav').find('li').removeClass('active');
			$this.parent().addClass('active');

			var bindings = JSON.parse($this.data('bindings').replace(/\'/g, '"'));

			for (var field in bindings){
				$(config.selectors[field]).val(bindings[field]).change();
			}
		});

		$('[type="reset"]').on('click', function(){
			delete localStorage.store;
			config.store = loadStore();
			drawProfiles();
		});

		$('#streetnumber-control').on('change', 'input, select', getRandomStreetNumber);
		$('#streetnumber-refresh').on('click', getRandomStreetNumber);

		$('form').submit(function(e){
			return true;

			e.preventDefault(); 

			var $form = $(this);
			
			// add vehicle
			var options = $.extend({}, config.page, { method: 'POST', data: $form.serialize() })

			$.get('http://localhost:8000/service/httpget?' + $.param(options), function(response){
				var data = response.data.replace(/<script(.|\s)*?\/script>/gi, '').replace(/src="(.|\s)*?"/gi, '');
				$('#page-contents').html(data);

				// submit form by removing vehicle add key
				var $addVehicleInput = $('#addVehicle input');
				$addVehicleInput.detach();

				var options = $.extend({}, config.page, { method: 'POST', data: $form.serialize() });
				options.cookie = response.cookie;
				console.log(options.cookie);

			});
		});

		var query = 'SELECT * FROM html WHERE url="http://www.city.waterloo.on.ca/desktopdefault.aspx?tabid=436"';
		$.queryYQL(query, 'xml', function(response){
			// remove script tags and any src attributes
			var data = response.results[0];
			var $contents = $('<div/>').html(data.replace(/<script(.|\s)*?\/script>/gi, '').replace(/src="(.|\s)*?"/gi, ''));
			
			// initialize UI 

			$contents.find('[name="__EVENTTARGET"], [name="__EVENTARGUMENT"], [name="__VIEWSTATE"]').appendTo('form');

			for (var field in config.selectors){
				var $element = $contents.find(config.selectors[field])
				if ($element.length) $('#' + field).html($element);
			}

			$('#streetnumber-value input').attr('readonly', true);

			var $addVehicle = $('#addVehicle *');

			$('#addVehicle').append(
				$('<input type="hidden">')
					.attr('name', $addVehicle.attr('name'))
					.attr('value', $addVehicle.attr('value'))
			);

			$addVehicle.remove();

			var $requestPermit = $('#requestPermit *');

			$('#requestPermit').append(
				$('<input type="submit" class="btn btn-primary">')
					//.attr('name', $requestPermit.attr('name'))
					.attr('value', 'Request Permit')
			);

			$requestPermit.remove();

			var date = new Date();
			date = new Date(date.getTime() + (24 * 60 * 60 * 1000)); // default in tomorrow's date

			$('#date input').val((date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear());

			$('#nights input').val(1);

			$('#loading-mask').fadeOut();
		});
		
		drawProfiles();
	});
}());