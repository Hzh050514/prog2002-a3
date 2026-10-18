# PROG2002 – Web Development II · Assessment 3

**Complete dynamic website for the charity events (crowdfunding) case study.**

Two Angular 21 websites (client + admin) sharing one Node.js / Express RESTful API
backed by MySQL, plus the optional Open-Meteo weather API.

---

## 1. Technology stack

| Layer | Technology |
|---|---|
| Client-side website | **Angular 21** (standalone components, signals, router) |
| Admin-side website | **Angular 21** (standalone components, signals, router) |
| API server | **Node.js + Express**, `mysql2` (prepared statements), `cors`, `dotenv` |
| Database | **MySQL 8 / MariaDB** |
| External API | **Open-Meteo** (`https://api.open-meteo.com`) – 7 day forecast |
| HTTP client | Angular `HttpClient` (`provideHttpClient(withFetch())`) |

Both websites are Angular projects inside one workspace, so a single
`npm install` is enough.

---

## 2. Project structure

```
A3/
├── api/                                   ← usernameA3-api.zip
│   ├── server.js                          Express entry point
│   ├── event_db.js                        MySQL pool + query helpers
│   ├── routes/
│   │   ├── events.js                      GET/POST/PUT/DELETE events
│   │   ├── registrations.js               GET/POST registrations
│   │   ├── categories.js                  GET categories
│   │   └── weather.js                     Open-Meteo proxy
│   ├── db/charity_events.sql              FULL schema + data export
│   ├── package.json
│   └── .env.example
│
└── charity-workspace/                     Angular workspace
    ├── projects/client/                   ← usernameA3-clientside.zip
    │   └── src/app/
    │       ├── home/                      Home page
    │       ├── search/                    Search page (filters + validation)
    │       ├── event-detail/              Event details + registrations + weather
    │       ├── registration/              New registration page
    │       ├── event.service.ts           API calls
    │       ├── weather.service.ts         Weather API calls
    │       └── models.ts / utils.ts
    └── projects/admin/                    ← usernameA3-adminside.zip
        └── src/app/
            ├── events-list/               List + Delete
            ├── event-new/                 New (Create)
            ├── event-edit/                Update + registrations
            └── admin.service.ts           CRUD API calls
```

---

## 3. Database setup (Part 1)

Import the single SQL export. It creates the database, the tables and loads
**13 events, 7 categories and 14 registrations** (the brief requires ≥ 10).

```bash
mysql -u <user> -p < api/db/charity_events.sql
```

Or via phpMyAdmin on cPanel → **Import** → choose `api/db/charity_events.sql`.

### This machine

The project uses the standard **`MySQL80` Windows service on port 3306**
(starts automatically with Windows). The database `prog2002_a3` has already
been imported there.

> Only if port 3306 is unavailable, `scripts/local-mysql.ps1` can run a
> throw-away instance on port 3307 (`start` / `stop` / `status` / `init`).
> It is a normal process, not a service, so it must be started again after
> every reboot. Its data lives in `C:\Users\Public\a3-mysql\data` — an
> ASCII-only path is required because `mysqld` cannot read non-ASCII paths
> such as `C:\Users\<name with Chinese characters>\...`.

### Schema

| Table | Purpose |
|---|---|
| `categories` | Lookup table for event categories |
| `events` | Charity events. **`latitude` / `longitude` were added in A3** for the weather API |
| `registrations` | **NEW in A3.** Who registered for which event |

`registrations` implements the rules required by the brief:

* `registration_id` – unique identifier (PK, auto increment)
* `name`, `email`, `phone` – user + contact details
* `number_of_tickets` – tickets purchased
* `registration_date` – date of registration
* `event_id` – **FOREIGN KEY → `events.event_id`**
* `UNIQUE (event_id, email)` – one person may register for **many** events,
  but only **once per event**

---

## 4. Running locally

### 4.1 API

```bash
cd api
npm install
cp .env.example .env        # then edit DB_USER / DB_PASSWORD
npm start                   # http://localhost:3000
```

`.env` values:

```
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your password>
DB_NAME=prog2002_a3
```

Check with <http://localhost:3000/api/health> → `{ "api": "ok", "database": "ok" }`.

### 4.2 Websites

```bash
cd charity-workspace
npm install
ng serve client            # http://localhost:4200
ng serve admin --port 4300 # http://localhost:4300
```

The API base URL is configured in
`projects/client/src/environments/environment.ts` and
`projects/admin/src/environments/environment.ts`.

---

## 5. RESTful API reference (Part 2)

| Method | Endpoint | Used by |
|---|---|---|
| GET | `/api/events` | Home + Search (filters `?q=&category_id=&status=&location=`) |
| GET | `/api/events/:id` | Event detail + admin update – **returns the event AND all its registrations, newest first** |
| POST | `/api/events` | Admin → New |
| PUT | `/api/events/:id` | Admin → Update |
| DELETE | `/api/events/:id` | Admin → Delete (**409 Conflict if the event has registrations**) |
| GET | `/api/categories` | Search dropdown + admin forms |
| GET | `/api/registrations?event_id=` | Optional cross-check |
| POST | `/api/registrations` | Client → Register page |
| GET | `/api/weather?latitude=&longitude=` | Event detail page (external API) |
| GET | `/api/health` | Deployment smoke test |

Quick checks with curl / Postman:

```bash
curl http://localhost:3000/api/events
curl http://localhost:3000/api/events/1
curl "http://localhost:3000/api/events?q=run&status=Active"
curl -X POST http://localhost:3000/api/events -H "Content-Type: application/json" \
     -d '{"event_name":"Test Gala","event_date":"2026-12-01","event_location":"Sydney, NSW","organiser_name":"Test Org","category_id":1,"status":"Active","target_funding":1000}'
curl -X DELETE http://localhost:3000/api/events/1     # -> 409, event 1 has registrations
```

---

## 6. Client-side website (Part 3)

| Page | Route | Highlights |
|---|---|---|
| Home | `/` | All events as cards, funding progress bars, status badges |
| Search | `/search` | Keyword / category / status / location filters with validation |
| Event detail | `/event/:id` | Event info, **registration list sorted by latest purchase date**, Register button, **7 day weather forecast** |
| Registration | `/register/:id` | Validated form → `POST /api/registrations` → confirmation → back to the event |

---

## 7. Admin-side website (Part 4)

| Page | Route | Feature |
|---|---|---|
| All events | `/events` | **List** every event regardless of status + **Delete** with inline confirmation |
| New event | `/events/new` | **Create** form with required-field validation |
| Update event | `/events/:id/edit` | **Update** form pre-filled from the API + the event's registrations |

The navigation menu is present on every page. Deleting an event that already has
registrations is blocked by the API and the returned message is shown to the user.

---

## 8. Deployment to SCU cPanel (Part 5)

**Full click-by-click instructions: see [`DEPLOYMENT.md`](DEPLOYMENT.md).**

1. Build the two sites:
   ```bash
   cd charity-workspace
   ng build client     # -> dist/client/browser
   ng build admin      # -> dist/admin/browser
   ```
2. Upload the **contents** of `dist/client/browser` to your cPanel public folder
   (e.g. `public_html/a3-client`) and `dist/admin/browser` to
   `public_html/a3-admin`.
3. Upload the `api` folder, run `npm install` there with cPanel's *Setup Node.js App*,
   and point the app at `server.js`.
4. Create the database in cPanel → *MySQL Databases*, import
   `db/charity_events.sql` with phpMyAdmin, then set the credentials in `.env`.
5. **Update `apiBaseUrl`** in both `environment.ts` files to the deployed API URL.
6. Zip the three deliverables:
   * `usernameA3-clientside.zip`
   * `usernameA3-adminside.zip`
   * `usernameA3-api.zip`

---

## 9. Deliverables checklist

- [x] Part 1 – database: new `registrations` table, FK, PK, ≥ 10 rows, SQL export
- [x] Part 2 – RESTful API: improved event-by-id endpoint + full CRUD for events
- [x] Part 3 – client site: event detail registrations + new registration page
- [x] Part 4 – admin site: list / new / update / delete + navigation
- [x] Part 5 – **packages built**, ready to upload to SCU cPanel (see `deliverables/`)  
      Rename each zip to `usernameA3-clientside.zip`, `usernameA3-adminside.zip`,
      `usernameA3-api.zip` before submitting. Actual upload needs your cPanel login.
- [x] Part 6 – external Open-Meteo weather API
- [~] GitHub repository – local repo **initialised + first commit**; add the remote
      and push when you have the repo URL:
      ```bash
      git commit --amend --author="Your Name <you@scu.edu.au>"   # fix the author first
      git remote add origin <your-repo-url>
      git push -u origin main
      ```
- [ ] Demo video (max 15 min) uploaded to SCU OneDrive
- [ ] Peer evaluation form – **each member fills it in individually and
      confidentially** and emails it to the tutor as
      `PROG2002_A3_[Team_ID]_[Member_name]`
- [ ] GenAI use declaration statement in the final submission
