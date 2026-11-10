'use strict';

import { Router } from 'express';
import { imageUpload } from '../../middlewares/file-uploader.js';
import { getProfile, updateProfile, uploadAvatar } from './user.controller.js';

const router = Router();

// Todas las rutas de perfil requieren autenticación previa (configs/app.js)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', imageUpload.single('avatar'), uploadAvatar);

export default router;
