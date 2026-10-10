# API és adatmodell

A végpontok `/api` előtaggal működnek. Az API session-cookie alapú; nem tárolunk tanári hozzáférési tokent a localStorage-ban. A tantermi cookie külön, korlátozott munkamenet.

Módosító kérések előtt: `GET /api/csrf`. A böngésző az `XSRF-TOKEN` cookie értékét az `X-XSRF-TOKEN` fejlécben küldi. A kliens `credentials: include` beállítást használ.

## Tanári műveletek

| Végpont | Művelet |
|---|---|
| POST `/auth/register` | Név, email, jelszó, megerősítés |
| POST `/auth/login` | Email és jelszó |
| GET `/auth/me` | Saját profil és tárhelyhasználat |
| POST `/auth/logout` | Saját bejelentkezés lezárása |
| PATCH `/auth/profile` | Név, opcionális jelszócsere jelenlegi jelszóval |
| POST `/auth/forgot-password` | Visszaállítási email kérése |
| POST `/auth/reset-password` | Token, email, új jelszó |
| GET/POST `/folders` | Saját mappák listája / létrehozása |
| PATCH/DELETE `/folders/{id}` | Saját mappa módosítása / törlése |
| GET/POST `/presentations` | Saját anyagok listája / multipart feltöltés |
| GET/PATCH/DELETE `/presentations/{id}` | Saját anyag megtekintése / módosítása / törlése |
| GET `/presentations/{id}/file` | Eredeti fájl letöltése |
| GET `/presentations/{id}/preview` | Vetíthető PDF |
| POST `/presentations/{id}/preview` | Kézi PDF-változat, multipart `file` mező |
| POST `/presentations/{id}/retry` | Sikertelen PPTX-konverzió újraindítása |
| GET/POST `/access-codes` | Hozzáférések listája / létrehozása |
| DELETE `/access-codes/{id}` | Kód és tantermi munkamenetek visszavonása |

## Tantermi műveletek

| Végpont | Művelet |
|---|---|
| POST `/classroom/enter` | Kód beváltása, külön HttpOnly cookie |
| GET `/classroom` | Kiválasztott anyagok, név, lejárat, letöltési jogosultság |
| POST `/classroom/leave` | Aktuális tantermi munkamenet törlése |
| GET `/classroom/presentations/{id}` | Kiválasztott prezentáció metaadatai |
| GET `/classroom/presentations/{id}/preview` | Kiválasztott PDF, ha a hozzáférés aktív |
| GET `/classroom/presentations/{id}/file` | Eredeti fájl, ha a letöltés engedélyezett |

## Adattáblák

- `users`: tanári fiókok, tárhelykeret; jelszó Laravel-hasheléssel.
- `folders`: tanárhoz kötött tantárgyi mappák.
- `presentations`: tulajdonos, mappa, eredeti és PDF-változat útvonala, mérete, konverziós állapot.
- `access_codes`: tulajdonos, kódlenyomat, lejárat, visszavonás, letöltési beállítás.
- `access_code_presentation`: az adott kóddal elérhető prezentációk.
- `classroom_sessions`: külön munkamenet-token lenyomata és lejárata.
- Laravel `sessions`, `cache`, `jobs`, `failed_jobs`, `password_reset_tokens`: háttérműködés.

A fájlútvonalakat és a hozzáférési lenyomatokat a JSON-válaszok nem adják vissza. Minden tanári fájlművelet a bejelentkezett tanár kapcsolataiból keres, így más tulajdonos azonosítójával sem kezelhető egy fájl.

A feltöltési kvótát és a konverzió mentését adatbázis-tranzakcióban, MySQL esetén felhasználói sorzárral ellenőrizzük. Az SQLite helyi fejlesztésre alkalmas; párhuzamos éles használathoz a Docker MySQL-konfiguráció javasolt.
