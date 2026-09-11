import cloudinary from '../config/cloudinary.js';

// Helper function to stream buffer directly to Cloudinary
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
};

// @desc Upload produce images (Up to 5 photos per produce)
// @route POST /api/upload/produce
export const uploadProduceImages = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'অনুগ্রহ করে অন্তত একটি ছবি সিলেক্ট করুন (Please select at least 1 image)' });
    }

    if (files.length > 5) {
      return res.status(400).json({ message: 'প্রতি ফসলের জন্য সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে (Maximum 5 photos allowed per produce)' });
    }

    // Upload all files in parallel
    const uploadPromises = files.map((file, index) => {
      return uploadBufferToCloudinary(file.buffer, {
        folder: 'agromarket/produce',
        tags: ['produce', 'crop'],
        transformation: [
          { width: 1200, height: 900, crop: 'limit' }
        ]
      }).then(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        sort_order: index
      }));
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.url);

    return res.status(200).json({
      success: true,
      message: `${results.length}টি ছবি ক্লাউডিনারিতে সফলভাবে আপলোড হয়েছে (${results.length} photos uploaded successfully)`,
      count: results.length,
      urls,
      images: results
    });
  } catch (err) {
    console.error('Produce images upload error:', err);
    return res.status(500).json({ message: 'ছবি আপলোড করতে ব্যর্থ হয়েছে (Failed to upload produce images)', error: err.message });
  }
};

// @desc Upload Farm Cover Photo
// @route POST /api/upload/farm-cover
export const uploadFarmCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'অনুগ্রহ করে খামারের কভার ছবি সিলেক্ট করুন (Please select a cover photo)' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'agromarket/farms/covers',
      tags: ['farm', 'cover'],
      transformation: [
        { width: 1600, height: 600, crop: 'limit' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'খামারের কভার ছবি সফলভাবে আপলোড হয়েছে (Farm cover uploaded)',
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (err) {
    console.error('Farm cover upload error:', err);
    return res.status(500).json({ message: 'কভার ছবি আপলোড ব্যর্থ হয়েছে', error: err.message });
  }
};

// @desc Upload Farm Profile Logo / Photo
// @route POST /api/upload/farm-logo
export const uploadFarmLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'অনুগ্রহ করে খামারের লোগো সিলেক্ট করুন (Please select a farm logo)' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'agromarket/farms/logos',
      tags: ['farm', 'logo'],
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'center' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'খামারের লোগো সফলভাবে আপলোড হয়েছে (Farm logo uploaded)',
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (err) {
    console.error('Farm logo upload error:', err);
    return res.status(500).json({ message: 'খামারের লোগো আপলোড ব্যর্থ হয়েছে', error: err.message });
  }
};

// @desc Upload Owner Profile Photo
// @route POST /api/upload/owner-avatar
export const uploadOwnerAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'অনুগ্রহ করে আপনার প্রোফাইল ছবি সিলেক্ট করুন (Please select owner photo)' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'agromarket/users/avatars',
      tags: ['user', 'avatar', 'owner'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে (Owner profile photo uploaded)',
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (err) {
    console.error('Owner avatar upload error:', err);
    return res.status(500).json({ message: 'প্রোফাইল ছবি আপলোড ব্যর্থ হয়েছে', error: err.message });
  }
};
