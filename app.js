var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');


var app = express();
var config = require('./config');

// Passport and database

var User = require('./model/user');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


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

app.get('/', function(req, res, next){
  res.sendfile( __dirname + '/views/' + 'index.html' );
});

app.get('/play', function(req, res, next){
  res.sendfile( __dirname + '/views/' + 'index.html' );
});

app.get('/tutorial', function(req, res, next){
  res.sendfile( __dirname + '/views/' + 'tutorial.html' );
});

app.get('/users', user.list);

app.get('/fbauth', 
  passport.authenticate('facebook', {scope: 'email'})
);

app.get('/fbauthed', passport.authenticate('facebook', {failureRedirect: '/'}), routes.loggedin);

app.get( '/*' , function(req, res, next) {
        var file = req.params[0]; 
        res.sendfile( __dirname + '/' + file );
})

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);
io.set('log level', 1);


// Lobby for the game

var lobby = new Lobby('Public', false);

io.sockets.on('connection', function (socket){

  socket.emit('message', 'SERVER: Connecting to lobby...');
  console.log('Player connected! Requesting identifiers...');

  socket.emit('request_id');
  socket.on('recieve_id', function (player_id){

    console.log('Identifiers for Player ' + player_id + ' recieved. Adding player to lobby...' );
    var player = new Player(player_id, socket);
    lobby.addPlayer(player);
  });
});



/////////////////////////////////////////////////////
// PLAYER
/////////////////////////////////////////////////////

function Player(playerId, socket, name, attributes){
    this.id = playerId;
    this.socket = socket;
    this.name = name ? name : "Player" + playerId;
    this.attributes = attributes ? attributes : {experience: 100};
    this.status = "chilling";
}

/////////////////////////////////////////////////////
// LOBBY
/////////////////////////////////////////////////////

// ...a couple of utility functions
Array.prototype.pushUnique = function (item){
    if(this.indexOf(item) == -1) {
        this.push(item);
        return true;
    }
    return false;
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

/////////////////////////////////////////////////////

function Lobby(name, isPrivate){
  this.id = "pub0";
  this.name = "Public";
  this.isPrivate = isPrivate ? isPrivate : false;

  this.waiting = new Array(); // A queue of players that are waiting to be matched
  this.players = {}; // an index of players by id
  this.state = 'pre-match';

  this.games = {}; // the games hosted by this lobby by id

  this.finished = new Array(); // a list of the games that are finished and ready to be
                    // processed

}

Lobby.prototype.addPlayer = function(player){
  this.waiting.pushUnique(player);
  this.players[player.id] = player;

  // Connect the player to the lobby's socket
  player.socket.join(this.id);

  player.socket.emit('message', 'LOBBY: Welcome to the ' + this.name + ' lobby. Please wait while we find you a suitable opponent...');


  console.log('Player ' + player.id + ' added to lobby.' );

  this.processPlayerQueue();

}

Lobby.prototype.startGame = function(player1, player2){
  // Set up and initialize the game and add both players
  // in the 'pre-match' state. Generate a game id and set up the game

  var gameId = Math.floor((Math.random() * 10000) + 1);
  var game = new Game(gameId, player1, player2);

  player1.socket.emit('message', 'LOBBY: Joining match against ' + player2.name + '...');
  player2.socket.emit('message', 'LOBBY: Joining match against ' + player1.name + '...');
}

Lobby.prototype.endGame = function (gameId){
  var game = this.games[gameId];
}

Lobby.prototype.removePlayer = function(player){
  // removes the player with the given socket
  // from the lobby

  this.players[player.id] = undefined;
  this.waiting.remove(player);
}

Lobby.prototype.recordResult = function(result){
  // Processes the results in the result queue and 
}

Lobby.prototype.processPlayerQueue = function(){

  // Necessary condition
  if (this.waiting.length > 0){
  // Checks the playerQueue for suitable matches and starts them

  // sort players in the queue by experience
  var xp_sort = function (player1, player2){
    return (player1.experience >= player2.experience);
  }
  
  var temp_queue = this.waiting;
  var max_players = (temp_queue.length % 2 === 0) ? temp_queue.length : temp_queue.length - 1;

  for (var i = 0; i < (max_players/2); i++){
      var player1 = temp_queue.pop();
      var player2 = temp_queue.pop();

      this.startGame(player1, player2);
  }

  this.waiting = [];
  for (var j = 0; j < temp_queue.length; j++){
    this.waiting.push(temp_queue[i]);
  }
  }
  
}

Lobby.prototype.checkGames = function(){
  for (game in this.games){
    if (game.state === 'finished'){
      console.log(game);
    }
  }
}

Lobby.prototype.spectate = function(){
  // Maybe?
}



/////////////////////////////////////////////////////
// QUADRANT 
/////////////////////////////////////////////////////

function Quadrant(){
 this.rows=3;
 this.cols=3;
 this.matrix = [[0,0,0],[0,0,0],[0,0,0]];
}

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
 this.rotationPerformed = true;
}


/////////////////////////////////////////////////////
// GAME
/////////////////////////////////////////////////////

/// ... utility functions for Game()

function fiveInARow (board, pos, direction, count, player){
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

/////////////////////////////////////////////////////

function Game(gameId, player1, player2){

   this.gameId = gameId ? gameId : "42";
   this.quadrants = { };
   this.result = 'no-result';
   this.state = 'pre-game';
   this.moveHistory = [];


   this.players = [false, player1, player2];

   this.playerTurn = 1;

   this.initializePlayer(player1);
   this.initializePlayer(player2);

   for (var i = 0; i < 4; i++){
       this.quadrants['' + i] = new Quadrant();
   }

   this.countdown = 20;
   this.board = new Array();

   this.markerPlaced = false;
   this.rotationPerformed = false;
}

Game.prototype.initializePlayer = function (player){

  player.socket.join(this.gameId);

  var button = "<button class='medium radius button' onclick='ready()'> Ready </button>" 
  player.socket.emit('message', 'Press when ready' + button);


  player.socket.on('ready_up', this.readyPlayer(this)); // Argument is playerId
  player.socket.on('place_marker', this.placeMarble(this)); 

  player.socket.on('request_rotate', this.rotateQuadrant(this));
}

Game.prototype.readyPlayer = function(self){
  return function (playerId){
    var player1 = self.players[1];
    var player2 = self.players[2]; 

    if (player1.id === playerId){
      player1.status = 'ready';
    }
    else if (player2.id === playerId){
      player2.status = 'ready';
    }

    if (player1.status === 'ready' && player2.status === 'ready'){
      self.updateGame();
    }
  }
}

Game.prototype.updateGame = function (){
  console.log(this.gameId);
  io.sockets.in(this.gameId).emit('message', 'both players are ready ');

  var localGame = {quadrants: this.quadrants};
  console.log(localGame);
  io.sockets.in(this.gameId).emit('start_game', localGame);
}


Game.prototype.endTurn = function (){
  this.playerTurn = (this.playerTurn === 1) ? 2 : 1;
  this.markerPlaced = false;
  this.rotationPerformed = false;
}

Game.prototype.isLegalPlace = function(pos,quadNum){
 var row = pos[0];
 var col = pos[1];
 var stateOfCell = this.quadrants[''+quadNum].matrix[row][col];
 if (stateOfCell != 0) {return false;}
 else {return true;}
}

Game.prototype.placeMarble = function(self){



  return function (playerId, pos, quad){
    console.log('PLACE MARKER CALLED');

    console.log(playerId === self.players[self.playerTurn].id);

    console.log(playerId);

    console.log(self.players);
    console.log(self.playerTurn);

    if (!self.markerPlaced && playerId === self.players[self.playerTurn].id && self.isLegalPlace(pos, quad)){
      var row = pos[0];
      var col = pos[1];

       if (self.quadrants[''+quad].matrix[row][col] != 0) { return false; }
       else {
        self.quadrants[''+quad].matrix[row][col] = self.playerTurn;
        self.markerPlaced = true;
      }


      self.markerPlaced = true;
      console.log('add marker emiited');
      io.sockets.in(self.gameId).emit('add_marker', self.playerTurn, pos, quad);  
    };
}


 
 //console.log(this.quadrants['0']);
 //console.log(this.quadrants['0'].matrix);

}

Game.prototype.rotateQuadrant = function(self){

  return function (player, direction, quad){
    if (self.markerPlaced == true && self.rotationPerformed == false && player == self.players[self.playerTurn].id){
      self.rotateQuadrant(direction, quad);
      
      var localGame = {quadrants: this.quadrants};
      console.log(localGame);
      
      io.sockets.in(self.gameId).emit('rotate_quadrant', localGame, direction, quad);
      self.endTurn();

      if (self.status == 'in_play'){
        io.sockets.in(self.gameId).emit('start_turn', self.players[self.playerTurn]);
      }
    }
  }


 this.quadrants['' + quadNum].rotateQuad(direction);
 this.rotationPerformed = true;
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

Game.prototype.checkWin = function(){
 var start = [0,0];
 console.log(this.board);
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


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////











