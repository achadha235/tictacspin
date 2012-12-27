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
     this.prototype.rotateQuad('cw');
   }
 }
}

function Player(){
 //initializing player
 this.name=0;
}

function Game(){
   this.quadrants = {};
   for (var i = 0; i < 4; i++){
       this.quadrants[''+i] = new Quadrant();
   }
   //console.log(this);
   this.playerTurn = 1;
   this.board = new Array();
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
 Quadrant.quadNum.prototype.rotateQuad(direction);
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
   return false;
 }
}