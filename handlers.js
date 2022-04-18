var config = require("./config");
var fs = require("fs");
const editJsonFile = require("edit-json-file");

function home(response, postData) {
  response.writeHead(200, { "Content-Type": "text/html" });
  response.end(fs.readFileSync("./public/index.html"));
}

function upload(response, postData) {
  var file = JSON.parse(postData);
  var fileRootName = file.name.split(".").shift();
  var fileExtension = file.name.split(".").pop();
  var filePathBase = config.upload_dir + "/";
  var fileRootNameWithBase = filePathBase + fileRootName;
  var filePath = fileRootNameWithBase + "." + fileExtension;
  var fileID = 2;
  var fileBuffer;

  while (fs.existsSync(filePath)) {
    filePath = fileRootNameWithBase + "(" + fileID + ")." + fileExtension;
    fileID += 1;
  }

  file.contents = file.contents.split(",").pop();

  fileBuffer = new Buffer(file.contents, "base64");

  if (config.s3_enabled) {
    var knox = require("knox");
    var client = knox.createClient(config.s3);
    var headers = { "Content-Type": file.type };

    client.putBuffer(fileBuffer, fileRootName, headers, function (err, res) {
      if (typeof res !== "undefined" && 200 === res.statusCode) {
        response.statusCode = 200;
      } else {
        response.statusCode = 500;
      }

      response.end();
    });
  } else {
    fs.writeFileSync(filePath, fileBuffer);
    response.statusCode = 200;
    response.end();
  }
}

function serveStatic(response, pathname, postData) {
  var extension = pathname.split(".").pop();
  var extensionTypes = {
    css: "text/css",
    gif: "image/gif",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    js: "application/javascript",
    png: "image/png",
  };
  response.writeHead(200, { "Content-Type": extensionTypes[extension] });
  response.end(fs.readFileSync("./public" + pathname));
}

function readJSON(response, postData) {
  fs.readFile('data.json', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(data);
  })
}

function writeJSON(response, postData) {
  var fileReceveid = JSON.parse(postData);

  let file = editJsonFile("data.json");

  file.append("marker", {name : fileReceveid.name, description: fileReceveid.description, lieu: fileReceveid.lieu, image: fileReceveid.image, icon: fileReceveid.icon, latitude: fileReceveid.latitude, longitude: fileReceveid.longitude});

  file.save();
}

module.exports = {
  home: home,
  serveStatic: serveStatic,
  upload: upload,
  readJSON: readJSON,
  writeJSON: writeJSON,
};
