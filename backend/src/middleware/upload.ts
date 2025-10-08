import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Ensure uploads directory exists
const uploadDir = config.upload.path;
console.log('Upload directory configured as:', uploadDir);
console.log('Upload directory exists:', fs.existsSync(uploadDir));

if (!fs.existsSync(uploadDir)) {
  console.log('Creating upload directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created successfully');
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination called with:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `photo-${uniqueSuffix}${ext}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('File filter called with:', file.originalname, 'MIME type:', file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected - not an image');
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
export const uploadPhoto = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB default
  },
  fileFilter: fileFilter
});

// Helper function to delete photo file
export const deletePhotoFile = (photoPath: string) => {
  if (photoPath && photoPath.startsWith('photo-')) {
    const fullPath = path.join(uploadDir, photoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Helper function to get photo URL
export const getPhotoUrl = (photoPath: string | null | undefined): string | null => {
  if (!photoPath) return null;
  return `/uploads/${photoPath}`;
};
