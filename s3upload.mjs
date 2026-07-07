import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

// AWS 자격증명은 환경변수에서 주입 — .env 파일 또는 터미널에서 set/export 후 실행
// Windows: $env:AWS_ACCESS_KEY_ID="..."
// macOS/Linux: export AWS_ACCESS_KEY_ID="..."
const BUCKET = 'sanavi-dev-frontend-306005334125-ap-northeast-2-an';
const DIST_DIR = new URL('dist', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const MIME_MAP = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function getContentType(f) {
  const ext = f.slice(f.lastIndexOf('.'));
  return MIME_MAP[ext] || 'application/octet-stream';
}

function walk(dir) {
  const res = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) {
      res.push(...walk(full));
    } else {
      res.push(full);
    }
  }
  return res;
}

let count = 0;
for (const file of walk(DIST_DIR)) {
  const key = relative(DIST_DIR, file).split('\\').join('/');
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: readFileSync(file),
    ContentType: getContentType(file),
  }));
  console.log('uploaded: ' + key);
  count++;
}
console.log('총 ' + count + '개 업로드 완료');
