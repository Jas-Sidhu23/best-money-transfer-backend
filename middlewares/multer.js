const multer          = require('multer');
const path            = require('path');
const fs              = require('fs');
const uploadDirectory = path.join(__dirname, '../uploads');
var storage           = multer.diskStorage({
  destination: function(req, file, cb) 
  {
    cb(null, uploadDirectory); 
  },
  filename: function(req, file, cb) 
  {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});
const uploadFile = multer({
  storage,
  limits: {
    fileSize: 1000000000000000 
  }
});

// Middleware to convert base64 images to files
const convertBase64ToFile = (req, res, next) => {
  req.image     = [];
  if (req.body.imageBase64 && req.body.imageBase64.length >0 && Array.isArray(req.body.imageBase64)) {
    req.body.imageBase64.forEach((base64Data, index) => {
      const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '');
      console.log(base64WithoutPrefix,'without prefix')
      const buffer   = Buffer.from(base64WithoutPrefix, 'base64');
      const fileName = `${Date.now()}_${index}.jpg`; 
      console.log(fileName, "FILENAME IS HERE")
      const filePath = path.join(uploadDirectory, fileName);
      fs.writeFileSync(filePath, buffer);
      req.image.push({ 
        path: filePath, 
        originalname: fileName 
      });
    });
    console.log(req.image, "filesssssssssssssssssssssssss")
  }
  next();
};

module.exports = { uploadFile, convertBase64ToFile};