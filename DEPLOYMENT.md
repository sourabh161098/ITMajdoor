# Deploying ITMajdoor

**Important:** Netlify can only host the **frontend**. The backend is a
persistent Socket.IO/WebSocket server with in-memory state, which Netlify's
static hosting + short-lived serverless functions cannot run. So:

- **Frontend (React/Vite)** → Netlify
- **Backend (Node + Socket.IO)** → Render (or Railway / Fly.io / a VM)

Deploy the backend first so you have its URL for the frontend.

---

## 1. Backend on Render

1. Push this repo to GitHub.
2. In [Render](https://render.com) → **New +** → **Blueprint**, select the repo.
   Render reads `render.yaml` and creates a web service from the `server/` folder.
   (Or **New +** → **Web Service** manually: root dir `server`, build
   `npm install`, start `npm start`.)
3. After the frontend is deployed, set the env var on the service:
   - `CLIENT_ORIGIN = https://YOUR-SITE.netlify.app`
     (comma-separate multiple; any `*.netlify.app` is auto-allowed for previews)
4. Note the service URL, e.g. `https://itmajdoor-server.onrender.com`.
5. Verify it's up: open `https://itmajdoor-server.onrender.com/health` →
   `{"status":"ok",...}`.

> Render's free tier sleeps after inactivity; the first request may take ~30s
> to wake. Fine for a demo.

---

## 2. Frontend on Netlify

1. In [Netlify](https://netlify.com) → **Add new site** → **Import from Git**,
   select the repo.
2. Set **Base directory** to `client` (so it uses `client/netlify.toml`).
   Build command `npm run build`, publish directory `dist` (already in the toml).
3. Add environment variables (Site settings → Environment variables):
   - `VITE_SERVER_URL = https://itmajdoor-server.onrender.com`
   - *(optional)* `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`
4. Deploy. Your app is live at `https://YOUR-SITE.netlify.app`.
5. Go back and set the backend's `CLIENT_ORIGIN` to this URL (step 1.3).

---

## 3. TURN (needed for reliable video across the internet)

STUN (already configured) works on many home/office networks, but users on
mobile data or strict/symmetric NATs will connect on the socket yet **fail to
establish video**. For a production-quality experience add a TURN server:

- Managed: Twilio Network Traversal Service, Metered, or Cloudflare Calls.
- Self-hosted: `coturn` on a small VM.

Then set `VITE_TURN_URL` / `VITE_TURN_USERNAME` / `VITE_TURN_CREDENTIAL` in
Netlify and redeploy. No code change needed — `src/constants/config.ts` picks
them up automatically.

---

## Local development

```bash
# terminal 1
cd server && npm install && npm run dev   # http://localhost:4000

# terminal 2
cd client && npm install && npm run dev   # http://localhost:5173
```

Camera/mic work on `localhost` without HTTPS. In production Netlify serves
HTTPS, which browsers require for `getUserMedia`.
