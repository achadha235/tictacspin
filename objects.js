


function Player(){
  //initializing player
  this.name=0;
}
  
function Quadrant(){
  this.rows=3;
  this.cols=3;
  this.value = [[0,0,0],[0,0,0],[0,0,0]];
}
// takes quadrant number and direction (clockwise cw and counter-clockwise cc)
// returns a new quadrant with marbles rotated
  Quadrant.prototype.rotateQuad = function (direction){
    var quadValue = this.value;
    //newQuad is a temporary variable that is changing to get the rotated marbles
    var newQuad =  this.value;
    var quadR = this.rows;
    var quadC = this.cols;
    //rotating clockwise
    if (direction == "cw"){
      for (var row=0;row<quadR;row++){
        for (var col=0;col<quadC;col++{
          //getting marble or empty (0,1,2) at row and col
          var marble = quadValue[row][col];
          //placing marble in new rotated pos
          newQuad.col.set(quadR-row,marble);
        }
      }
      this.value = newQuad;
    }
    else{
      //rotating counter clockwise (rotat cw 3 times)
      for(var t=0; t<3; t++){
        this.prototype.rotateQuad('cw');
      }
    }
  }

function Game(){
  this.quadrants = {
    0: new Quadrant(),
    1: new Quadrant(),
    2: new Quadrant(),
    3: new Quadrant()
  };
  this.playerTurn = 1;
}

  Game.prototype.isLegalPlace = function(pos,quadNum){
    var row = pos[0];
    var col = pos[1];
    var stateOfCell = this.quadrant.quadNum.value[row][col];
    if (stateOfCell != 0) {return false;}
    else {return true;}
  }

  Game.prototype.placeMarble = function(pos,quadNum){
    var row = pos.get(0);
    var col = pos.get(1);
    if(this.quadrant.quadNum.value[row][col] != 0) {return False;}
    else {this.quadrant.quadNum.value[row][col] = this.playerTurn;}
  }

  Game.prototype.rotateQuadrant = function(direction,quadNum){
    Quadrant.quadNum.prototype.rotateQuad(direction);
  }

  Game.prototype.putBoardTogether = function(){
    //add top quadrants 0 and 1
    for (var row=0; row<this.quadrants.0.rows; rows++){
      for(var quad = 0; quad<2; quad++){
        this.board.add(this.quadrants.quad.value.row);
      }
    }
    //add bottom quadrants 2 and 3
    for (var row=0; row<this.quadrants.0.rows; rows++){
      for(var quad =2; quad<4; quad++){
        this.board.add(this.quadrants.quad.value.row);
        }  
    }

  function fiveInARow(pos,direction,count,player){
    if (count === 5) {return true};
    var row = pos[0];
    var col = pos[1];
    if (col<8){
      //check right
      newPos = [row,col+1]
      if (this.board[row][col+1] === player){
        fiveInARow(newPos,'right',count+1,player);
      }
      else{
        fiveInARow(newPos,'right',0,player);
      }
    }
    if (row<8){
      //check down
      newPos = [row+1,col]
      if (this.board[row][col+1] === player){
        fiveInARow(newPos,'right',count+1,player);
      }
      else{
        fiveInARow(newPos,'right',0,player);
      }
    }
    if (row<8 && col<8){
      //check diag
      newPos = [row,col+1]
      if (this.board[row][col+1] === player){
        fiveInARow(newPos,'right',count+1,player);
      }
      else{
        fiveInARow(newPos,'right',0,player);
      }
    }
    
  Game.prototype.checkWin = function(){
    Game.prototype.putBoardTogether;
    var start = [2,2]  
  }


    