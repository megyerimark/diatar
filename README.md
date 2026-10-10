# Diatár

Saját tanári prezentációtár Angular + Laravel alapon. A tanár saját eszközén kezeli az anyagait, a tantermi gépen pedig egy időkorlátos kóddal nyitja meg a kiválasztott prezentációkat.

## Mi van a projektben?

- Teljes Angular alkalmazás, külön HTML-sablonokkal és SCSS-stílusokkal.
- Laravel API, migrációk, privát fájltárolás és háttérfeldolgozás.
- Regisztráció, bejelentkezés, kijelentkezés, profil- és jelszómódosítás.
- Emailes jelszó-visszaállítás, beállítható SMTP-küldéssel.
- Saját tantárgyi mappák: létrehozás, átnevezés, színválasztás, törlés.
- PDF és makrómentes PPTX feltöltése; fájlonként alapértelmezetten 50 MB.
- Felhasználónként 1 GB tárhely; az eredeti és a külön PDF-változat is beleszámít.
- Keresés, több anyag kijelölése, átnevezés, mappába helyezés és törlés.
- PowerPoint–PDF átalakítás LibreOffice segítségével, háttérfeladatként.
- Saját PDF-változat feltöltése, ha a konverzió elrendezése javításra szorul.
- PDF-vetítés lapozással, nyílbillentyűkkel, diaszámmal és teljes képernyővel.
- Az eredeti fájl letöltése.
- 10 karakteres, véletlenszerű tantermi kódok; 30, 60, 120 vagy 240 perces érvényesség.
- A kód csak a kiválasztott anyagokra jogosít. Az eredeti letöltése kikapcsolható.
- Lejárat és visszavonás ellenőrzése minden tantermi API-kérésnél.
- „Óra vége” gomb a tantermi munkamenet lezárásához.
- Reszponzív felület, magyar szövegek, toast értesítések és megerősítő ablakok.
- Docker Compose és külön helyi fejlesztői indítás.
- API-tesztek a jogosultságokra, fájlokra, lejáratra, konverzióra és CSRF-védelemre.

## A leggyorsabb indítás: Docker

Szükséges: Docker Desktop, valamint Node.js a beállítóprogramhoz. Dockerben a PHP, MySQL, LibreOffice, Angular build és webszerver is rendelkezésre áll.

A projekt gyökérmappájában:

```bash
node scripts/init-env.mjs
docker compose up --build -d
```

Nyisd meg: **http://localhost:8080**

Az első build több percig tarthat. A migrációs szolgáltatás megvárja az adatbázist; a háttérfeldolgozó és az alkalmazás csak utána indul.

1. Kattints a „Saját tárhely létrehozása” gombra és regisztrálj.
2. Tölts fel például egy fájlt a `frontend/public/assets/` mintái közül.
3. Jelöld ki a kártyáján az anyagot, majd készíts tantermi kódot.
4. Jegyezd fel a megjelenő kódot.
5. Külön böngészőprofilban vagy privát ablakban nyisd meg a `/classroom` oldalt.
6. Írd be a kódot: a tanári fiók nélkül indul a vetítés vagy letöltés.

Állapot és naplók:

```bash
docker compose ps
docker compose logs --tail=80 app worker migrate
```

Leállítás, az adatok megtartásával:

```bash
docker compose down
```

A fájlok és az adatbázis Docker-kötetekben megmaradnak. A `down -v` törölné a köteteket; ne használd, ha meg szeretnéd őrizni az anyagokat.

## Helyi indítás Docker nélkül, Macen

Szükséges: Node.js 22.12+ vagy 24, PHP 8.3+ (pdo_sqlite, zip, mbstring, fileinfo, XML/DOM), Composer 2 és LibreOffice.

A projekt gyökerében:

```bash
node scripts/setup-local.mjs
```

Ez telepíti a csomagokat, létrehozza a `backend/.env` fájlt és az SQLite-adatbázist, valamint lefuttatja a migrációkat. A meglévő alkalmazáskulcsot megtartja.

A `backend/.env` fájlban Macen szükség esetén állítsd be:

```dotenv
LIBREOFFICE_BINARY="/Applications/LibreOffice.app/Contents/MacOS/soffice"
```

Három külön terminálban:

```bash
# 1. terminál, a projekt gyökeréből
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
# 2. terminál, a projekt gyökeréből
cd backend
php artisan queue:work --sleep=1 --tries=2 --timeout=100
```

```bash
# 3. terminál, a projekt gyökeréből
npm start
```

Böngésző: **http://localhost:4200**. Az Angular proxy továbbítja az `/api` kéréseket a Laravelhez, így a cookie-k és a CSRF-védelem ugyanazon origin alatt működnek.

A PHP-beállításokat a `php --ini` mutatja. Nagy feltöltésekhez a használt php.ini-ben legalább:

```ini
upload_max_filesize=50M
post_max_size=52M
memory_limit=256M
```

A fejlesztői webszervernek is ezeket a beállításokat kell használnia; változtatás után indítsd újra.

A lejárt hozzáférések takarítása fejlesztéskor külön `php artisan schedule:work` paranccsal indítható. A lejárat ellenőrzése ettől függetlenül azonnali, a takarítás csak régi rekordokat távolít el.

## Demó és valódi alkalmazás

```bash
npm run build:demo
```

A demó ugyanazt az Angular felületet mutatja, mint az éles alkalmazás. A mintaprezentációk PDF-jei valódi, lapozható fájlok. A feltöltések IndexedDB-ben, a demó metaadatai és kódjai a böngészőben maradnak. A demókód más eszközön nem használható. A demó nem küld emailt és nem végez automatikus PowerPoint-konverziót; ott saját PDF-változat tölthető fel.

A valódi, több gép között használható alkalmazás:

```bash
npm run build
```

Ez a **Laravel API-t** használja. A Docker webimage alapértelmezetten ezt a konfigurációt építi, a demómód nem kapcsolódik be.

## Emailes visszaállítás

Fejlesztéskor a `MAIL_MAILER=log` nem küld emailt; a visszaállítási link a Laravel naplójába kerül. Éles használathoz állítsd be az SMTP-szolgáltató adatait az aktív `.env` fájlban:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=no-reply@sajat-domain.hu
MAIL_FROM_NAME="Diatár"
FRONTEND_URL=https://sajat-domain.hu
```

TLS-hez a szolgáltató beállításait kövesd; a Laravel 12 `MAIL_SCHEME` beállítását a `backend/config/mail.php` használja. A jelszavakat csak `.env`-ben tárold. Ez a fájl nincs a forráscsomagban.

## Éles tárhely

A teljes alkalmazást saját szerveren kell futtatni. A mellékelt online bemutató statikus demó; nem futtat PHP-t.

A legegyszerűbb telepítés egy Docker-futtatásra alkalmas VPS:

1. Másold fel a forráskódot és futtasd az `init-env.mjs` programot.
2. Állítsd az `APP_URL` és `FRONTEND_URL` értékét a saját HTTPS-domainedre.
3. HTTPS mögött legyen `SESSION_SECURE_COOKIE=true` és `APP_DEBUG=false`.
4. Állítsd be az SMTP-t, majd indítsd a Compose-szolgáltatásokat.
5. A domain HTTPS-forgalmát továbbítsd a webszolgáltatás 8080-as portjára.
6. Készíts rendszeres mentést a `diatar_database` és `diatar_storage` kötetekről, valamint az alkalmazáskulcsról.

Hagyományos PHP-webtárhelyen is használható a Laravel + Angular, de a háttérfeldolgozó és a LibreOffice futtatását külön ellenőrizni kell. LibreOffice nélkül a kézi PDF-változat és a PPTX-letöltés használható; automatikus konverzióhoz külön feldolgozó szükséges.

Az alkalmazás az alapkonfigurációban ugyanazon domain alatt szolgálja ki az Angular felületet és az API-t. Külön frontend/API domainekhez cookie- és CORS-beállítások módosítása szükséges.

## Mit garantál a hozzáférési kód?

A kód rövid életű, korlátozott hozzáférés. Nem ad tanári bejelentkezést. A szerver csak a kódhoz kiválasztott prezentációkat engedi kiadni. A teljes kódot csak létrehozáskor mutatjuk meg; a szerver az SHA-256 lenyomatát tárolja. A tantermi munkamenet külön HttpOnly cookie-ban él.

A szerver a visszavonás után nem ad ki új fájlt. A már letöltött vagy megnyitásra a böngésző memóriájába került példányokat nem lehet visszavenni. A tantermi nézet 30 másodpercenként ellenőrzi a hozzáférést, a felhasználó az „Óra vége” gombbal is kiléphet.

A „csak vetítés” beállítás az eredeti PPTX letöltési végpontját tiltja. A megjelenített PDF adatai szükségképpen eljutnak a böngészőbe; ez nem másolásvédelem.

## PowerPoint-megjelenítés

A LibreOffice-konverzió PDF-et készít. Egyes betűtípusok, áttűnések és elemek eltérhetnek; animációk és beágyazott videók nem működnek a statikus PDF-vetítésben. A tanár feltöltés után ellenőrizze a PDF-et, vagy töltsön fel PowerPointból exportált saját változatot. Az eredeti fájlt változatlanul megőrizzük.

## Ellenőrzés

```bash
npm run build
npm run test:demo
cd backend
composer install
php vendor/bin/phpunit
```

A valódi konverziós teszthez LibreOffice kell. A tesztadatbázis memóriában él, a tesztek külön ideiglenes fájltárolást használnak.

Az átadáskor végrehajtott ellenőrzéseket a `docs/ELLENORZES.md` tartalmazza.

## Hol mit módosíts?

- `frontend/src/app/pages/*.html`: az oldalak HTML-sablonjai.
- `frontend/src/app/pages/*.ts`: az oldalak viselkedése.
- `frontend/src/styles.scss`: színek, térközök, reszponzív elrendezés.
- `frontend/src/app/core/api.service.ts`: a szerverrel kommunikáló kliens.
- `frontend/src/app/core/demo.ts`: csak a demó működése.
- `frontend/src/app/routes.ts`: Angular útvonalak.
- `backend/routes/web.php`: az API útvonalai, session- és CSRF-védelemmel.
- `backend/app/Http/Controllers/`: API-műveletek.
- `backend/app/Services/`: fájlellenőrzés és fájlkiszolgálás.
- `backend/app/Jobs/ConvertPresentation.php`: automatikus konverzió.
- `backend/database/migrations/`: adatbázisséma.
- `backend/.env`: helyi szerverbeállítások; Dockerben a gyökér `.env` fájlja aktív.
- `compose.yaml`: adatbázis, API, feldolgozó, ütemező és webszerver.

Az első módosításokhoz a logót és a főoldali szöveget a `landing.html`, a színpalettát pedig a `styles.scss` elején találod.
