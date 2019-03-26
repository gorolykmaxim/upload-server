module.exports = {
  //language=HTML
  template: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>File Upload</title>\n  <link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css">\n  <style>\n    html {\n      height: 100%;\n    }\n\n    body {\n      margin: 0;\n      background-color: #2590EB;\n      height: 100%;\n      font-family: "Arial Black";\n    }\n\n    .wrapper {\n      width: 100%;\n      height: 100%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n    }\n\n    h3 {\n      color: white;\n      font-weight: bold;\n    }\n\n    .wrapper .file-upload {\n      height: 200px;\n      width: 200px;\n      border-radius: 100px;\n      position: relative;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      border: 4px solid #FFFFFF;\n      overflow: hidden;\n      background-image: linear-gradient(to bottom, #2590EB 50%, #FFFFFF 50%);\n      background-size: 100% 200%;\n      transition: all 1s;\n      color: #FFFFFF;\n      font-size: 100px;\n      margin: 15px;\n    }\n\n    .wrapper .file-upload input[type=\'file\'] {\n      height: 200px;\n      width: 200px;\n      position: absolute;\n      top: 0;\n      left: 0;\n      opacity: 0;\n      cursor: pointer;\n    }\n\n    .wrapper .file-upload:hover {\n      background-position: 0 -100%;\n      color: #2590EB;\n    }\n\n  </style>\n</head>\n<body>\n\n<form class="wrapper" action="/upload" method="POST" enctype="multipart/form-data">\n\n  <h3>First, select your file: </h3>\n\n  <div class="file-upload">\n    <input type="file" name="file"/> <i class="fa fa-folder-open-o"></i>\n  </div>\n\n  <h3>Then, click to upload file:</h3>\n\n  <div class="file-upload">\n    <button type="submit"><i class="fa fa-3x fa-cloud-upload"></i></button>\n  </div>\n\n</form>\n\n</body>\n</html>\n'
};