
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.sendfile( __dirname + 'index.html');
};

exports.loggedin = function(req, res){
  res.render('loggedin', { title: 'Anarchy', name: req.user.name.split(" ")[0].toUpperCase() });
};

exports.tutorial = function (req, res){
    res.sendfile( __dirname + 'tutorial.html');
}