# Portfolio

A portfolio website with a Windows 11 desktop interface. Built with React, Vite, Tailwind CSS, and a Go server.

The desktop has a four-second startup screen, a Start menu, File Explorer, and windows that can be moved, resized, minimized, and snapped. The Games folder contains Solitaire, Snake, 2048, Breakout, Pinball, Chess, and Minesweeper. Chess supports a computer opponent and two players on the same screen.

Resume and Contact Me open directly from the desktop. Resume has a portrait, English and Persian versions, and a PDF download for each language. Contact Me has email, LinkedIn, and phone links, with copy buttons and both languages. The GitHub icon opens my profile in a new tab. There is no database.

```text
frontend/   React app, styles, assets, and browser tests
backend/    Go server and portfolio files
```

Use Node.js 24 and Go 1.27.2 or newer.

To run locally:

```sh
git clone https://github.com/mhmmdmhdvi/Portfolio.git
cd Portfolio
npm --prefix frontend ci
npm --prefix frontend run dev
```

This starts Vite at http://127.0.0.1:5173 and the Go server at http://127.0.0.1:8080. The frontend proxies API requests to Go.

To build and serve the production version, stop the development server first:

```sh
npm --prefix frontend run build
npm --prefix frontend start
```

Open http://127.0.0.1:8080. The Go server serves the frontend build, including precompressed Brotli and gzip assets. For deployment, put the server behind an HTTPS reverse proxy and leave `DEV_ORIGIN` unset.

The server accepts these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `LISTEN_ADDR` | `127.0.0.1:8080` | Server address |
| `CONTENT_DIR` | `content` | Files shown in Documents |
| `WEB_DIR` | `../frontend/dist` | Frontend build directory |
| `DEV_ORIGIN` | Unset | Development frontend origin; disables static serving |

Paths are relative to `backend/` when using the commands above. Add public resume files to `backend/content/`; they appear in Documents. Supported formats are PDF, text, PNG, JPEG, WebP, GIF, MP3, and MP4. Keep private files outside that folder.

Resume content lives in `frontend/src/data/resume.js` and `frontend/src/data/resume.fa.js`. After editing it, run `npm --prefix frontend run resume:pdf` to regenerate both PDFs in `backend/content/resume/`.

To run the checks:

```sh
npm --prefix frontend test
npm --prefix frontend run test:e2e
go -C backend test ./...
go -C backend vet ./...
```

Browser tests use Microsoft Edge on Windows. On Linux or macOS, install Playwright's Chromium first by running `npx playwright install chromium` from `frontend/`.

Games run in the browser and load when opened. Chess calculations use a worker. Games pause when their window is inactive, the tab is hidden, or the desktop is restarting.

Third-party asset notices are in `frontend/public/assets/LICENSE` and `frontend/public/assets/licenses/`.
