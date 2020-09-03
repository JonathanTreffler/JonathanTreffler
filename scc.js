fs = require('fs');
fs.readFile("scc.html", 'utf8', function (err,data) {
  var scc = data;
});
fs.readFile("README.md", 'utf8', function (err,data) {
  var readme = data;
});

let startString = "<!-- /start_scc/ -->";
let endString = "<!-- /end_scc/ -->";

let startIndex = readme.indexOf(startString);
let endIndex = readme.indexOf(endString);

console.log("=========");
console.log(startIndex, endIndex);

let betweenString = readme.substring(startIndex, endIndex)

let searchString = startString + betweenString + endString;

console.log("=========");
console.log(searchString);

let replaceString = startString + scc + endString;

console.log("=========");
console.log(replaceString);

let result = readme.replace(searchString, replaceString);

console.log("=========");
console.log(result);
