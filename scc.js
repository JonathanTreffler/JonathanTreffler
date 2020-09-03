fs = require('fs');
fs.readFile("scc.html", 'utf8', function (err,data) {
  console.log(data);
});
fs.readFile("README.md", 'utf8', function (err,data) {
  console.log(data);
});
