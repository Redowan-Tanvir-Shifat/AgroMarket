import express from 'express';
import {
  uploadProduceImages,
  uploadFarmCover,
  uploadFarmLogo,
  uploadOwnerAvatar
} from '../controllers/uploadController.js';
import {
  uploadSingleImage,
  uploadProduceImagesMiddleware,
  handleMulterErrors
} from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload up to 5 produce photos at once or one-by-one
router.post('/produce', handleMulterErrors(uploadProduceImagesMiddleware), uploadProduceImages);

// Upload single farm cover photo
router.post('/farm-cover', handleMulterErrors(uploadSingleImage), uploadFarmCover);

// Upload single farm profile logo
router.post('/farm-logo', handleMulterErrors(uploadSingleImage), uploadFarmLogo);

// Upload single owner profile photo
router.post('/owner-avatar', handleMulterErrors(uploadSingleImage), uploadOwnerAvatar);

export default router;
