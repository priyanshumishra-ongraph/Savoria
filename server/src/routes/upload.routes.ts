import express, { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/auth.middleware';
import { param } from 'express-validator';
import { validate } from '../validators/recipe.validator';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const folder = req.params.folder || 'misc';
    const dynamicUploadDir = path.join(__dirname, `../../uploads/${folder}`);
    if (!fs.existsSync(dynamicUploadDir)) {
      fs.mkdirSync(dynamicUploadDir, { recursive: true });
    }
    cb(null, dynamicUploadDir);
  },
  filename(req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const title = req.body.title;
    if (title) {
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${safeTitle}${ext}`);
    } else {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
      cb(null, `${Date.now()}-${safeName}`);
    }
  },
});

function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
}

const ALLOWED_FOLDERS = ['avatars', 'recipes'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: function (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const folder = String(req.params.folder ?? '');
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return cb(new Error('Invalid upload folder'));
    }
    checkFileType(file, cb);
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
      const folder = req.params.folder || 'misc';
      if (req.file) {
        res.json({
          message: 'Image uploaded successfully',
          imageUrl: `/uploads/${folder}/${req.file.filename}`,
        });
      } else {
        res.status(400).json({ message: 'No image file provided' });
      }
    });
  }
);

export default router;
