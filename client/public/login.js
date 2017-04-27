$('#log').on('submit', function(e){
	e.preventDefault();
	var form = $(this);
	var userData = form.serialize();

	$.ajax({
		type: 'POST',
		url: '/login',
		data: userData,
	}).done(function(dataRecieved){
		if(dataRecieved){
			window.location.href = "/www/index.html";
		} else {
			window.location.href = "/public/accessDenied.html";
		}
		form.trigger('reset');
	})
	.fail(function(data){
		window.location.href = "/public/accessDenied.html";
	});
});


$('#reg').on('submit', function(e){
	e.preventDefault();
	var form = $(this);
	var userData = form.serialize();

	$.ajax({
		type: 'POST',
		url: '/register',
		data: userData,
	}).done(function(dataRecieved){
		if(dataRecieved === "sucsess"){
			alert("your username has been created sucsessfuly , now try to login");
		} else {
			if(dataRecieved === "exist"){
				alert("Username alredy exists");
			}
			else{
				alert("try again");
			}
		}
		form.trigger('reset');
	})
	.fail(function(data){
		console.log("there was an error");
	});
});