const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/imgs");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        cb(null, file.originalname + '-' + uniqueSuffix);
    }
})

const upload = multer({ storage: storage });
module.exports = upload;
