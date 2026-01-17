const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Diretório de uploads
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

// Criar diretórios se não existirem
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// Configuração de storage para avatares
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATARS_DIR);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: userId_timestamp_random.ext
    const userId = req.user?.sub || 'unknown';
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}_${timestamp}_${randomStr}${ext}`);
  },
});

// Filtro de tipos de arquivo para imagens
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMimes.includes(file.mimetype);
  const extOk = allowedExts.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não permitido. Use JPG, PNG ou WebP.'), false);
  }
};

// Middleware de upload de avatar
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

// Função para deletar arquivo de avatar
function deleteAvatarFile(filename) {
  if (!filename) return;

  const filePath = path.join(AVATARS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Função para extrair nome do arquivo da URL
function getFilenameFromUrl(avatarUrl) {
  if (!avatarUrl) return null;

  // URL será algo como /uploads/avatars/filename.jpg
  const parts = avatarUrl.split('/');
  return parts[parts.length - 1];
}

module.exports = {
  uploadAvatar,
  deleteAvatarFile,
  getFilenameFromUrl,
  UPLOADS_DIR,
  AVATARS_DIR,
};
