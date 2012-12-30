// http://colorschemedesigner.com/#0041ToLtIwtwG8----
$(document).ready(function() {
	showMenu();
});

var history = [];
var messagebox = [];
var messageLimit = 3;
var socket;
var id;
var menuHidden = false;




// Ready function
function ready(){
	socket.emit('ready_up', id);
}

function onlineGameStartClicked(){
	socket = io.connect('http://localhost');

	id = Math.floor(Math.random() * 1000 + 1);
	var name = "Player " + id;
	var localGame; // local copy of game state
	var net_players;
	var current_player;


	// mouse down coordinates and quadrant
	var mousedown = {x: 0, y: 0, quadNum:0};

	socket.on('request_id', function(){
		socket.emit('recieve_id', id);
	});

	socket.on('message', function (message){

		if (messagebox.length >= messageLimit){
			history.push(messagebox[0]);
			messagebox = messagebox.slice(1);
		}
		messagebox.push(message);
		drawMessageBox(messagebox);
	});

	socket.on('start_game', function (game){
		console.log(game);
		localGame = game;
		drawGame();

		if (!menuHidden){
			toggleMenu();
		}
	});

	socket.on('update_game', function (game){
		localGame = game;
		updateAnimations();
	});

	socket.on('add_marker', function (player, pos, quadrant){

	
		console.log('add marker recieved');

		addMarker(player, pos, quadrant);
		localGame.markerPlaced = true;
		updateAnimations();
	});

	socket.on('rotate_quadrant', function (direction, quad){
		rotateQuadrant(direction, quad);
		localGame.rotationPerformed = true;
		updateAnimations();
	});

	socket.on('game_over', function (winner){
		if (winner === 1){console.log('X wins!!!');}
		if (winner === 2){console.log('O wins!!!');}
		showMenu();
	});

	function updateAnimations(){
		if (!localGame.markerPlaced){
			$('.quadcells').each(function (index){
				$(this).removeClass('expanded');
			})
		}

		if (localGame.markerPlaced){
			$('.quadcells').each(function (index){
				$(this).addClass('expanded');
			})
		}
	}

	function hideMenu(){
		$('#sideMenu').fadeOut(500,'swing');
		$('#sideMenu').transition({ x: '-130px'});
		$('.board').transition({ x: '-110px' });
	}

	function showMenu(){
		$('#sideMenu').fadeOut(500,'swing');

		$('#sideMenu').transition({ x: '0px' });
		$('.board').transition({ x: '0px' });
	}



	function drawMessageBox(messagebox){
		var messageList = $('#messageList')
		messageList.empty();
		console.log(messagebox)
		for (var i = messagebox.length - 1; i >= 0 ; i--){
			var messageElement = $(document.createElement('h6'));
			messageElement.addClass('subheader');
			messageElement.html(messagebox[i]);
			messageElement.appendTo(messageList);
		}

	}

	function drawGame(){
		// Empty the board
		$('.board').empty();
		$('.board').bind('mouseleave', function(event){
			$('.quadcells').each(function (index){
				$(this).removeClass('expanded');
			});
		})
		
		// Then rebuild it from the game state
		for (var i = 0; i < 4; i++){
			var quadrant = $(document.createElement('div'))
			quadrant.attr('id', 'q' + i);
			

			var cellHolder = $(document.createElement('div'));
			cellHolder.addClass('quadcells');

			cellHolder.appendTo(quadrant);


			for (var j = 0; j < 9; j++){
				var cell = $(document.createElement('div'))
				cell.bind("click", function(event){
					var clickedCell = $(event.target);				
					var cellNum = parseInt(clickedCell.attr('id').slice(4));
					var row = Math.floor(cellNum / 3);
					var col = Math.floor(cellNum % 3);

					var quadNum = parseInt(clickedCell.closest('.quadrant').attr('id').slice(1));
					makeMove([row, col], quadNum);
				});
				cell.attr('id', 'cell' + j);
				cell.addClass('cell');
				
				var quad = '' + i;	
				var row = Math.floor(j / 3);
				var col = j % 3;

				if (localGame.quadrants['' + i].matrix[row][col] !== 0){

					playerMarker = (localGame.quadrants[quad].matrix[row][col] == 1) ? '&#215' : '&#9675' ;
					cell.html(playerMarker);
				}
				cell.appendTo(cellHolder);
			}
			quadrant.addClass('quadrant');
			quadrant.appendTo($('.board'));// Append the quadrant to the board

			updateAnimations();

			// Add rotation event handlers for the quadrant
			
			$('#q' + i).bind('mouseup', function(event) {
				var x = event.pageX - $(event.target).offset().left
				var y = event.pageY - $(event.target).offset().top

				var dx = x - mousedown.x;
				var dy = y - mousedown.y;

				var posdx = (dx > 0) ? true : false;
				var posdy = (dy > 0) ? true : false;

				var target_width = $(event.target).width();

				var downQuadNum = mousedown.quadNum;
				var upQuadNum = parseInt($(event.target).closest('.quadrant').attr('id').slice(1))

				if (downQuadNum === upQuadNum){
					var subQuadNum;

					if (mousedown.x > target_width/2){
						if (y > target_width/2){subQuadNum = 2;}
						else{subQuadNum = 1;}
					}
					else {
						if (mousedown.y > target_width/2){subQuadNum = 3;}
						else{subQuadNum = 0;}
					}

					if (subQuadNum === 0){
						if (posdx && !posdy){ requestRotate('cw', downQuadNum);}
						else if (!posdx && posdy){ requestRotate('cc', downQuadNum);}
					}
					if (subQuadNum === 1){
						if (posdx && posdy){ requestRotate('cw', downQuadNum);}
						else if (!posdx && !posdy){ requestRotate('cc', downQuadNum);}
					}
					if (subQuadNum === 2){
						if (!posdx && posdy){ requestRotate('cw', downQuadNum);}
						else if (posdx && !posdy){ requestRotate('cc', downQuadNum);}
					}
					if (subQuadNum === 3){
						if (!posdx && !posdy){ requestRotate('cw', downQuadNum);}
						else if (posdx && posdy){ requestRotate('cc', downQuadNum);}
					}
				}
			});

			$('#q' + i).bind('mousedown', function(event) {
				var x = event.pageX - $(event.target).offset().left
				var y = event.pageY - $(event.target).offset().top
				var quadNum = parseInt($(event.target).closest('.quadrant').attr('id').slice(1));

				mousedown.x = x;
				mousedown.y = y;
				mousedown.quadNum = quadNum;
			});	

			$('#q' + i).bind('mouseover', function(event) {
				$(event.target).closest('.quadcells').addClass('expanded');
			});

			$('#q' + i).bind('mouseleave', function(event) {
					$(event.target).closest('.quadcells').removeClass('expanded');
			});	   
		} 
	}

	function makeMove(pos, quad){
		socket.emit('place_marker', id, pos, quad);
		  console.log('PLACE MARKER EMMITED');

	}
	// Add a marker to the view on the given location
	function addMarker(player, pos, quad){
		//localGame.quadrants['' + quad][pos[0]][pos[1]] = player;
		var quadSelector = '#q' + quad;
		var cellNumber = (pos[0] * 3) + pos[1];
		var cellSelector = '#cell' + cellNumber;
		console.log(player);
		var playerMarker = (player == 1) ? '&#215' : '&#9675' ;

		$(quadSelector + ' ' + cellSelector).html(playerMarker);
		$(quadSelector + ' ' + cellSelector).addClass('placed');
		setTimeout(function(){
			$(quadSelector + ' ' + cellSelector).removeClass('placed');
		});

		$('#q' + quad).closest('.quadcells').css({
			'padding': '0 0 0 0'
		});
	}

	function requestRotate(direction, quad){
		console.log('rotation requested');
		socket.emit('request_rotate', id, direction, quad);
	}

	function rotateQuadrant(direction, quad){

		if (direction == 'cw'){
			$('#q' +  quad).transition({ rotate: '90deg' }, 500, 'in-out');
		}
		if (direction == 'cc'){
			$('#q' +  quad).transition({ rotate: '-90deg' }, 500, 'in-out');
		}
		setTimeout(drawGame, 480);
		setTimeout(function(){
			$('.quadcells').each(function (index){
				$(this).removeClass('expanded');
			})
		}, 500);
	}

}

	function hideMenu(){
		$('#sideMenu').transition({ x: '-130px',  scale:1, opacity:0});
		$('.board').transition({ x: '-110px', scale:1, opacity:1});
		$('#topbar').transition({ y: '-40px'});
		$('#menuToggler').addClass('textglow');
		menuHidden = true;
	}

	function showMenu(){
		$('.board').transition({ x: '0px', scale: 0.8, opacity:0.5 });
		$('#sideMenu').transition({ x: '0px',scale:1, opacity:1 });	
		$('#topbar').transition({ y: '0px'});
		$('#menuToggler').removeClass('textglow');
		menuHidden = false;
	}

	function toggleMenu(){
		if (menuHidden){
			showMenu();
		}
		else {
			hideMenu();
		}
	}





