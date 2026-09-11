import multer from 'multer';

// Use memory storage so we can directly stream buffer to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max per file
  },
  fileFilter
});

// Single image upload field named 'image'
export const uploadSingleImage = upload.single('image');

// Multiple images upload field named 'images', max 5 photos per produce
export const uploadProduceImagesMiddleware = upload.array('images', 5);

// Error handling wrapper for Multer errors
export const handleMulterErrors = (uploadFunc) => (req, res, next) => {
  uploadFunc(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum allowed size is 10MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files uploaded. Maximum 5 photos allowed per produce.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};
