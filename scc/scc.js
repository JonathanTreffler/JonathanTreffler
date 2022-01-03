fs = require('fs');
const { updateSection } = require("../file-section-updater/file_updater.js");

fs.readFile("../scc.html", 'utf8', function (err,data) {
  let startString = "<!-- /start_scc/ -->";
  let endString = "<!-- /end_scc/ -->";

  updateSection("../README.md", startString, endString, data);
});
