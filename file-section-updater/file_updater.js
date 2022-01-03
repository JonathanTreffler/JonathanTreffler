fs = require('fs');

exports.updateSection = function (filename, startString, endString, content) {
    let readme = fs.readFileSync(filename, "utf8");

    console.log(readme);

    let startIndex = readme.indexOf(startString);
    let endIndex = readme.indexOf(endString);

    console.log("=========");
    console.log("startIndex, endIndex:", startIndex, endIndex);

    let betweenString = readme.substring(startIndex, endIndex)

    let searchString = betweenString + endString;

    console.log("=========");
    console.log("searchString:", searchString);

    let replaceString = startString + "\n" + content + endString;

    console.log("=========");
    console.log("replaceString:", replaceString);

    let result = readme.replace(searchString, replaceString);

    console.log("=========");
    console.log("result:", result);

    fs.writeFileSync(filename, result);
}
