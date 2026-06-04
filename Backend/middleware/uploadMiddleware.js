const multer = require("multer")

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Only image files are allowed (JPEG, PNG, WEBP)"), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
})

module.exports = upload