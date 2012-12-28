var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');


var app = express();
var config = require('./config');

var User = require('./model/user');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;




function Lobby(){
  this.name = 1;
}


Lobby.prototype.addPlayer = function(player){
  // Push a unique player to the lobby
}

Lobby.prototype.startGame = function(player1, player2){
  // Start a new game between two players and push it to the queue. Return the
  // gameID when game is started
}

Lobby.prototype.endGame = function (gameId){
  // Ends the game with the given gameId 
}

Lobby.prototype.removePlayer = function(playerId){
  // removes the player with the given playerId from the lobby and disconnects then from
  // socket
}

Lobby.prototype.recordResult = function(result){
  // Processes the results in the result queue and 
}

Lobby.prototype.processPlayerQueue = function(){
  // Checks the playerQueue for suitable matches and starts them.
}

Lobby.prototype.checkGames = function(){
  // Checks the state of each game and logs the result of the game
}

Lobby.prototype.spectate = function(){
  // Maybe?
}


























passport.serializeUser(function (user, done){
  done(null, user.fbId);
});

passport.deserializeUser(function (id, done){
  User.findOne({'fbId': id}, function (err, user){
    done(err, user);
  });
});

passport.use(new FacebookStrategy(
  // Login stuff
  { clientID: config.dev.fb.appId,
    clientSecret: config.dev.fb.appSecret,
    callbackURL: config.dev.fb.url + "fbauthed" },


  // Callback
  function (req, accessToken, refreshToken, profile, done){
    process.nextTick(function(){ // For async
      var query = User.findOne({'fbId': profile.id});

      query.exec(function (err, oldUser){ // Query the database
        if (oldUser){ // If user is found log in and log to console
          console.log('Existing User:' + oldUser.name + ' has been logged in');
          //console.log(oldUser);
          done(null, oldUser);
        }
        else {
          var newUser = new User(); // Otherwise, create a new user and save to the database
          newUser.fbId = profile.id;
          newUser.name = profile.displayName;
          newUser.email = profile.emails[0].value;

          newUser.save(function (err){ // Error callback for save
            if (err) {throw err;}
            console.log('New User:' + newUser.name + ' has been saved and logged in');
            //console.log(newUser);
            done(null, newUser);
          });
          //console.log(newUser);
        }
      });
    });
  }
));

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.set('view options', {layout: true});
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));

  app.use(express.session({secret: 'anarchy'}));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/fbauth', 
  passport.authenticate('facebook', {scope: 'email'})
);
app.get('/fbauthed', passport.authenticate('facebook', {failureRedirect: '/'}), routes.loggedin);


app.get('/tutorial', routes.loggedin);

app.get( '/*' , function(req, res, next) {
        var file = req.params[0]; 
        res.sendfile( __dirname + '/' + file );
})

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);
io.set('log level', 1);

var players = [];
var game;


io.sockets.on('connection', function (socket){
  game = new Game();

  socket.emit('request_id');
  socket.on('recieve_id', function (player_id){
    var player = new Player(player_id);
    var player_name = 'Player '+ player_id;
    players.push({id: player_id, name: player_name});

    if (players.length === 2){
      io.sockets.emit('start_game', game, players);
      setTimeout( function(){
        io.sockets.emit('start_turn', players[game.playerTurn - 1].id);
        console.log('Emiited start turn for Player' + players[game.playerTurn - 1].id );
      }, 500);
      
    }
  });

  socket.on('place_marker', function (player, pos, quad){
    console.log('player' + player + 'attempted move ' + pos + ', ' + quad);
   // console.log(player === players[game.playerTurn - 1].id);
    console.log(!game.markerPlaced);
    //console.log(game.isLegalPlace(pos, quad));
    if (!game.markerPlaced && player === players[game.playerTurn - 1].id && game.isLegalPlace(pos, quad)){
      game.placeMarble(pos, quad);
      game.markerPlaced = true;
      io.sockets.emit('add_marker', game.playerTurn, pos, quad);
      
    };
  });

  socket.on('request_rotate', function (player, direction, quad){


    if (game.markerPlaced == true && game.rotationPerformed == false && player == players[game.playerTurn - 1].id){
      game.rotateQuadrant(direction, quad);
      game.rotationPerformed = true;
      

      io.sockets.emit('rotate_quadrant', game, direction, quad);
      game.endTurn();

      if (game.status == 'in_play'){
        io.sockets.emit('start_turn', players[game.playerTurn - 1]);
      }
    }
  });

});

/////////////////////////////////////////////////////
/////////////////////// GAME //////////////////////////


function Quadrant(){
 this.rows=3;
 this.cols=3;
 this.matrix = [[0,0,0],[0,0,0],[0,0,0]];
}
// takes quadrant number and direction (clockwise cw and counter-clockwise cc)
// returns a new quadrant with marbles rotated
Quadrant.prototype.rotateQuad = function (direction){
 var quadmatrix = this.matrix;
 //newQuad is a temporary variable that is changing to get the rotated marbles
 var newQuad = [[0,0,0],[0,0,0],[0,0,0]];
 var quadR = this.rows;
 var quadC = this.cols;
 //rotating clockwise
 if (direction == "cw"){
   for (var row=0;row<quadR;row++){
     for (var col=0;col<quadC;col++){
       //getting marble or empty (0,1,2) at row and col
       var marble = quadmatrix[row][col];
       // if (marble === 1) {console.log(marble)};
       //placing marble in new rotated pos
       newQuad[col][quadR-row-1] = marble;
     }
   }
   this.matrix = newQuad;
 }
 else{
   //rotating counter clockwise (rotat cw 3 times)
   for(var t=0; t<3; t++){
     this.rotateQuad('cw');
   }
 }
}

function Player(name, playerId){
    this.name = name ? name : "bob" ;
}

function Game(gameId){

   this.gameId = gameId ? gameid : "42";
   this.quadrants = { };

   for (var i = 0; i < 4; i++){
       this.quadrants[''+i] = new Quadrant();
   }

   this.playerTurn = 1;
   this.board = new Array();

   this.markerPlaced = false;
   this.rotationPerformed = false;

   this.state = 'not started';
} 



Game.prototype.isLegalPlace = function(pos,quadNum){
 var row = pos[0];
 var col = pos[1];
 var stateOfCell = this.quadrants[''+quadNum].matrix[row][col];
 if (stateOfCell != 0) {return false;}
 else {return true;}
}

Game.prototype.placeMarble = function(pos,quadNum){
 var row = pos[0];
 var col = pos[1];
 //console.log(this.quadrants['0']);
 //console.log(this.quadrants['0'].matrix);
 if(this.quadrants[''+quadNum].matrix[row][col] != 0) {return false;}
 else {this.quadrants[''+quadNum].matrix[row][col] = this.playerTurn;}
}

Game.prototype.rotateQuadrant = function(direction,quadNum){
  console.log('lame bug');
  console.log(direction, quadNum);
 this.quadrants['' + quadNum].rotateQuad(direction);
}

Game.prototype.putBoardTogether = function(){
   this.board = new Array();
   var quads = this.quadrants;
   var rows = quads['0'].rows;
   for (var i = 0; i < rows; i++){
       var q0_row = quads['0'].matrix[i].slice(0);
       var q1_row = quads['1'].matrix[i].slice(0);
       var new_row = q0_row.concat(q1_row);
       this.board.push(new_row)
   }

   for (i = 0; i < rows; i++){
       var q2_row = quads['2'].matrix[i].slice(0);
       var q3_row = quads['3'].matrix[i].slice(0);
       var new_row = q2_row.concat(q3_row);
       this.board.push(new_row)
   }
   //console.log(this.board);
}

function fiveInARow (board, pos,direction,count,player){
 //console.log(pos[0]);
 if (count === 5) {return true};
 var row = pos[0];
 var col = pos[1];
 if (col < 5){
   //check right
   newPos = [row,col+1];
   //console.log(board);
   if (board[row][col+1] === player){
     if (direction === 'right' || direction === 'all'){
       if (fiveInARow(board, newPos,'right',count+1,player)) {return true;};
     }
     else if (board[row][col]===player){
       if (fiveInARow(board, newPos,'right',2,player)) {return true;};
     }
     else{ 
       if (fiveInARow(board, newPos,'right',1,player)) {return true;};      
     }
   }
   else{
     if (fiveInARow(board, newPos,'right',0,player)) {return true;};
   }
 }
 if (row<5){
   //check down
   newPos = [row+1,col]
   if (board[row+1][col] === player ){
     if (direction === 'down' || direction === 'all'){
       if (fiveInARow(board, newPos,'down',count+1,player)) {return true;};
     }
     else if (board[row][col]===player){
       if (fiveInARow(board, newPos,'down',2,player)) {return true;};
     }
     else{ 
       if (fiveInARow(board, newPos,'down',1,player)) {return true;};      
     }
   }
   else{
     if (fiveInARow(board, newPos,'down',0,player)) {return true;};
   }
 }
 if (row<5 && col<5){
   //check diag
   newPos = [row+1,col+1]
   if (board[row+1][col+1] === player){
     if (direction === 'diag' || direction === 'all'){
       if (fiveInARow(board, newPos,'diag',count+1,player)) {return true;};
     }
     else if (board[row][col]===player){
       if (fiveInARow(board, newPos,'diag',2,player)) {return true;};
     }
     else{ 
       if (fiveInARow(board, newPos,'diag',1,player)) {return true;};      
     }

   }
   else{
     if (fiveInARow(board, newPos,'diag',0,player)) {return true;};
   }
 }

 return false;
}

function rotateBoard(board){
   var rows = board.length;
   //console.log(rows);
   var cols = board[0].length;
   //console.log(cols);
   var temp = [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]];
   for(var i=0; i<rows; i++){
       for(var j=0; j<cols; j++){
           temp[j][rows-i-1]=board[i][j];
       }
   }
   return temp;
}

Game.prototype.checkWin = function(){
 var start = [0,0];
 var rotBoard = rotateBoard(this.board);
 //console.log(rotBoard);
 var whiteWins = (fiveInARow(this.board.slice(0), start,'all',1,1)||fiveInARow(rotBoard, start,'all',1,1));
 if (whiteWins) {return 1;}
 else{
   var blackWins = (fiveInARow(this.board.slice(0), start,'all',1,2)||fiveInARow(rotBoard, start,'all',1,2));
   if (blackWins) {return 2;}
   return 0;
 }
}











