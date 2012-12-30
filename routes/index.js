
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.sendfile( __dirname + 'index.html');
};

exports.loggedin = function(req, res){
  res.redirect('/play');
};

exports.tutorial = function (req, res){
    res.sendfile( __dirname + 'tutorial.html');
}