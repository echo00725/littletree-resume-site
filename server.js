const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'xiaoshu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sunny329';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `upload-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('需要后台账号密码');
  }

  let user = '';
  let pass = '';
  try {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
    const idx = decoded.indexOf(':');
    if (idx >= 0) {
      user = decoded.slice(0, idx);
      pass = decoded.slice(idx + 1);
    }
  } catch {
    // ignore
  }

  if (!safeEqual(user, ADMIN_USER) || !safeEqual(pass, ADMIN_PASSWORD)) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('账号或密码错误');
  }

  return next();
}

function getDefaultProfile() {
  return {
    name: '你的名字',
    title: '书法艺术生',
    tagline: '以笔为舟，以墨为海。',
    about: '我是一名热爱传统书法与当代视觉表达的艺术生，专注于楷书、行书与创作展示。',
    phone: '你的电话',
    email: 'your@email.com',
    city: '中国 · 城市',
    photo: '/uploads/default-avatar.svg',
    specialty: '行楷创作',
    trajectory: '2022年系统临摹唐楷入门；2023年转入行书训练并建立日课；2024年开始主题创作与展览实践；2025年关注书法与当代视觉呈现的融合。',
    portfolio: {
      title: '代表作品（可在后台修改）',
      desc: '请上传你最能代表个人风格的一幅作品，并补充创作意图。',
      image: '/default-avatar.svg'
    },
    portfolioItems: [],
    skills: ['楷书', '行书', '篆隶基础', '书法创作', '展陈设计'],
    education: [
      {
        school: 'XX艺术学院',
        major: '书法学',
        period: '2022 - 2026',
        detail: '主修书法史、碑帖临摹、创作实践。'
      }
    ],
    projects: [
      {
        name: '《墨韵四季》主题创作',
        period: '2025',
        desc: '围绕四季意象完成系列书法作品，并进行线上展陈。'
      }
    ],
    awards: [
      '2025 校级书法展 优秀作品奖',
      '2024 市青年书法比赛 三等奖'
    ]
  };
}

function loadProfile() {
  if (!fs.existsSync(PROFILE_PATH)) {
    const d = getDefaultProfile();
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(d, null, 2), 'utf-8');
    return d;
  }
  try {
    const content = fs.readFileSync(PROFILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    const d = getDefaultProfile();
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(d, null, 2), 'utf-8');
    return d;
  }
}

function saveProfile(profile) {
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/profile', (_req, res) => {
  res.json(loadProfile());
});

app.post('/api/profile', requireAdmin, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: '无效数据' });
  }
  const old = loadProfile();
  const merged = {
    ...old,
    ...incoming,
    specialty: typeof incoming.specialty === 'string' ? incoming.specialty : old.specialty,
    trajectory: typeof incoming.trajectory === 'string' ? incoming.trajectory : old.trajectory,
    portfolio: (incoming.portfolio && typeof incoming.portfolio === 'object')
      ? { ...old.portfolio, ...incoming.portfolio }
      : old.portfolio,
    skills: Array.isArray(incoming.skills) ? incoming.skills : old.skills,
    education: Array.isArray(incoming.education) ? incoming.education : old.education,
    projects: Array.isArray(incoming.projects) ? incoming.projects : old.projects,
    awards: Array.isArray(incoming.awards) ? incoming.awards : old.awards,
    portfolioItems: Array.isArray(incoming.portfolioItems) ? incoming.portfolioItems : (old.portfolioItems || [])
  };
  saveProfile(merged);
  res.json({ ok: true, profile: merged });
});

app.post('/api/upload-photo', requireAdmin, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传图片' });
  const profile = loadProfile();
  profile.photo = `/uploads/${req.file.filename}`;
  saveProfile(profile);
  res.json({ ok: true, photo: profile.photo });
});

app.post('/api/upload-work', requireAdmin, upload.single('work'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传作品图片' });
  const profile = loadProfile();
  profile.portfolio = profile.portfolio || {};
  profile.portfolio.image = `/uploads/${req.file.filename}`;
  saveProfile(profile);
  res.json({ ok: true, image: profile.portfolio.image });
});

app.post('/api/upload-works', requireAdmin, upload.array('works', 30), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '未上传作品图片' });
  }
  const profile = loadProfile();
  profile.portfolioItems = profile.portfolioItems || [];
  const appended = req.files.map((f) => ({
    id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    image: `/uploads/${f.filename}`,
    title: '',
    desc: ''
  }));
  profile.portfolioItems.push(...appended);
  saveProfile(profile);
  res.json({ ok: true, items: profile.portfolioItems });
});

app.post('/api/update-work', requireAdmin, (req, res) => {
  const { id, title, desc } = req.body || {};
  if (!id) return res.status(400).json({ error: '缺少id' });

  const profile = loadProfile();
  profile.portfolioItems = (profile.portfolioItems || []).map((x) => (
    x.id === id ? { ...x, title: title || '', desc: desc || '' } : x
  ));
  saveProfile(profile);
  res.json({ ok: true, items: profile.portfolioItems });
});

app.post('/api/delete-work', requireAdmin, (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: '缺少id' });

  const profile = loadProfile();
  profile.portfolioItems = (profile.portfolioItems || []).filter((x) => x.id !== id);
  saveProfile(profile);
  res.json({ ok: true, items: profile.portfolioItems });
});

app.get('/admin', requireAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Resume site running on http://localhost:${PORT}`);
});
