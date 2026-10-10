import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env')) { console.log('A .env már létezik; a meglévő beállításokat megtartottam.'); }
else {
 const key=randomBytes(32).toString('base64'), db=randomBytes(24).toString('hex'), root=randomBytes(24).toString('hex');
 writeFileSync('.env',`APP_NAME="Diatár"
APP_ENV=production
APP_KEY=base64:${key}
APP_DEBUG=false
APP_URL=http://localhost:8080
FRONTEND_URL=http://localhost:8080
APP_LOCALE=hu
APP_FALLBACK_LOCALE=en
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=diatar
DB_USERNAME=diatar
DB_PASSWORD=${db}
MYSQL_ROOT_PASSWORD=${root}
SESSION_DRIVER=database
SESSION_COOKIE=diatar_owner
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=strict
CACHE_STORE=database
QUEUE_CONNECTION=database
DB_QUEUE_RETRY_AFTER=150
FILESYSTEM_DISK=local
MAIL_MAILER=log
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME="Diatár"
LOG_CHANNEL=stderr
LOG_LEVEL=warning
DIATAR_STORAGE_MB=1024
DIATAR_UPLOAD_MB=50
LIBREOFFICE_BINARY=soffice
`,{mode:0o600});
 console.log('A .env elkészült egyedi kulcsokkal. Indítás: docker compose up --build -d');
}
