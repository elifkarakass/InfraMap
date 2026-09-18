# InfraMap — Infrastructure Project Tracking Map
<img width="1917" height="1011" alt="image" src="https://github.com/user-attachments/assets/3ebc94ff-8d16-44d9-86e9-65ef90db0127" />


A web application for tracking road, drinking water, sewerage, wastewater, and GIS/photogrammetry projects on a full-screen satellite map. It features a glassmorphism interface, a Flask + SQLite backend, and a Leaflet.js map, with English and Turkish language support.

## Why This Project?

I previously developed data analytics projects using Python, SQL, Flask/FastAPI, and Chart.js, including fintech funnel analysis, a cryptocurrency dashboard, and a weather dashboard.

With InfraMap, I applied the same approach to mapping and GIS, designing a tool to help engineering companies manage infrastructure projects geographically.

## Features

- **Full-screen interactive map** — satellite, street, and terrain views, with colored markers for different project types.
- **Four main tabs:**
  - **Home** — summary statistics and a filterable project list.
  - **Projects** — a table of projects showing their name, type, status, and district.
  - **Analysis** — Chart.js visualizations of project distribution by type and status.
  - **Reports** — summaries by type and status, CSV export, and printing.
- **Add projects by clicking the map** — coordinates are filled in automatically.
- **Edit and delete projects** — open a project's details to update or delete it.
- **Filtering and search** — filter projects by type, status, or search text.
- **English/Turkish interface** — switch languages using the button in the top-right corner.
- **CSV export and printing** — export all project records or print a summary from the Reports tab.
- **REST API** — project data and statistics are available as JSON through `/api/projeler` and `/api/istatistikler`, independently of the frontend.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Python, Flask |
| Database | SQLite using Python's built-in `sqlite3` module, without an ORM |
| Frontend | HTML, CSS with glassmorphism styling, Vanilla JavaScript |
| Maps | Leaflet.js, Esri map layers, OpenStreetMap |
| Charts | Chart.js |
| Internationalization | English/Turkish translations using a key-value dictionary |

## Installation and Setup

Clone the repository:

```bash
git clone https://github.com/elifkarakass/InfraMap.git
cd InfraMap
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on **Windows PowerShell**:

```powershell
.\venv\Scripts\Activate.ps1
```

Or on **macOS/Linux**:

```bash
source venv/bin/activate
```

Install dependencies and start the application:

```bash
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

On the first run, the application automatically creates the database and adds sample projects. An internet connection is required to load external map tiles and CDN-hosted libraries.

## Project Structure

```text
InfraMap/
├── app.py                 # Flask routes, SQLite queries, and REST API
├── requirements.txt
├── templates/
│   └── index.html         # Single-page interface, tabs, and project form
└── static/
    ├── css/
    │   └── style.css      # Glassmorphism theme and responsive layouts
    └── js/
        └── app.js         # Map, tabs, API calls, charts, translations, and export
```

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/projeler` | List projects with optional `tip`, `durum`, and `q` filters |
| GET | `/api/projeler/<id>` | Retrieve a single project |
| POST | `/api/projeler` | Create a project |
| PUT | `/api/projeler/<id>` | Update a project |
| DELETE | `/api/projeler/<id>` | Delete a project |
| GET | `/api/istatistikler` | Retrieve project counts grouped by type and status using SQL `GROUP BY` |

## AI-Assisted Development

I used Claude for coding assistance, debugging, and application planning, including Flask routes, SQLite queries, Leaflet integration, and the tab-based frontend structure.

I also used OpenAI Codex to refine the interface, improve the English/Turkish language support, and check core functionality. Automated checks covered project creation, retrieval, updates, deletion, filtering, and selected validation cases.

## Project Status

InfraMap is a personal portfolio and learning project intended for local use and demonstrations. Authentication, user permissions, and production deployment are planned improvements.

## Roadmap

- [ ] Support polygons and lines, such as road routes, alongside point markers.
- [ ] Add user authentication and authorization.
- [ ] Rebuild the frontend with React and TypeScript.

## License

Licensing has not yet been configured. An MIT license can be added by including a `LICENSE` file in the repository.
