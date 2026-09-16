import express, { Request } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { protect } from '../middleware/auth.middleware';
import { param } from 'express-validator';
import { validate } from '../validators/recipe.validator';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const folder = req.params.folder || 'misc';
    
    // Attempt to generate a public_id based on the title or original name
    let public_id = '';
    const title = req.body.title;
    if (title) {
      public_id = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    } else {
      const ext = path.extname(file.originalname);
      const nameWithoutExt = file.originalname.slice(0, -ext.length);
      public_id = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }
    
    public_id = `${Date.now()}-${public_id}`;

    return {
      folder: `savoria/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: public_id,
    };
  },
});

const ALLOWED_FOLDERS = ['avatars', 'recipes'];

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: function (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const folder = String(req.params.folder ?? '');
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return cb(new Error('Invalid upload folder'));
    }
    cb(null, true);
  },
});

router.post(
  '/:folder',
  protect,
  param('folder').isIn(['avatars', 'recipes']).withMessage('Invalid upload folder'),
  validate,
  (req: Request, res: express.Response, next: express.NextFunction) => {
    upload.single('image')(req, res, (err) => {
      if (err) return next(err);
      if (req.file) {
        res.json({
          message: 'Image uploaded successfully',
          imageUrl: req.file.path, // Cloudinary provides the secure URL in req.file.path
        });
      } else {
        res.status(400).json({ message: 'No image file provided' });
      }
    });
  }
);

export default router;
