# Átadáskori ellenőrzések

## Végrehajtva

- Angular production build: sikeres.
- Angular demo build: sikeres.
- A Laravel API útvonalai betölthetők.
- A demó tanári és tantermi adatfolyamának Node-alapú ellenőrzése: sikeres.
- PHP API- és jogosultsági tesztek SQLite tesztadatbázissal: 18 teszt, 98 ellenőrzés sikeres.
- Valódi, háromdiás PPTX automatikus konverziója privát PDF-fájlra LibreOffice-szal.
- A production npm-függőségek auditja: nem jelzett ismert sérülékenységet.
- Composer audit: nem jelzett ismert sérülékenységet.

A tesztek ellenőrzik a regisztrációt, kijelentkezést, tulajdonosi elkülönítést, kód hatókörét, lejáratát, visszavonását, letöltési tiltást, tantermi kilépést, fájltípusokat, kvótát, mappaműveleteket, saját PDF-feltöltést, emailes visszaállítás kérését, rate limitet és a valódi konverziót.

## Környezeti korlátok

Ebben a munkakörnyezetben nem volt elérhető támogatott böngészőtesztelő vagy Docker-daemon. A vizuális böngészős ellenőrzést és a Docker Compose teljes indítását ezért nem futtattuk. A forráskódot és a buildet ellenőriztük, a helyi Docker-indítást a README lépéseivel lehet végrehajtani.

A konverziós teszt az itt elérhető LibreOfficeDev 26.8 segítségével futott; a Docker image saját LibreOffice-csomagot telepít. A konkrét tanári fájlok megjelenését a használni kívánt környezetben is ellenőrizni kell.

Az emailkérés tesztje teszt-értesítést használ. Valódi SMTP-kézbesítéshez saját szolgáltatói beállítás kell; az átadáskor élő emailküldést nem végeztünk.
