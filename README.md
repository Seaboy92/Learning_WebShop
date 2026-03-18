# WebShop (Lernprojekt)

Dies ist ein sehr einfacher kleiner Webshop als Lernprojekt. Er stellt eine kleine API sowie eine statische Frontend-Oberfläche bereit und erlaubt das Durchsuchen von Artikeln, das Zusammenstellen eines Warenkorbs sowie das Abschicken einer Bestellung.

## Inhalte

- **Backend (Node.js)**
  - Minimaler HTTP-Server ohne externe Abhängigkeiten (nur Node Core)
  - API für Artikel (`/api/articles`) und Bestellungen (`/api/orders`)
  - Daten werden lokal in `backend/data/articles.json` gespeichert

- **Frontend (HTML/JS)**
  - Seiten: Start, Suche, Warenkorb, Checkout, Impressum
  - Warenkorb im `localStorage` des Browsers
  - Fetch-basierte Kommunikation mit dem Backend

## Projektstruktur

- `backend/` – Servercode, Daten und API
- `frontend/` – Statische HTML-/CSS-/JS-Dateien
- `backend/data/articles.json` – Artikelstamm (optional anpassen)
- `frontend/images/` – Produktbilder (SVG)

## Starten

1. Terminal öffnen und ins Backend-Verzeichnis wechseln:
   ```bash
   cd backend
   ```
2. Server starten:
   ```bash
   node server.js
   ```
3. Im Browser öffnen:
   ```
   http://localhost:3000
   ```

## Hinweise

- Es gibt kein Benutzer-Login / keine Registrierung mehr – der Shop ist bewusst minimal gehalten.
- Bestellungen werden derzeit **nicht dauerhaft gespeichert**, sondern nur in der Konsole protokolliert.

---

Dieses Projekt und README wurde teilweise mithilfe von **GitHub Copilot** erstellt.
