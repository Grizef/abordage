# Server installation — step by step

Deploys the site (`master`) on an OVHcloud VPS running Ubuntu, behind Caddy for HTTPS,
run by systemd. Replace `<…>` placeholders with your values.

```
Internet ──443──▶ Caddy (HTTPS, auto certificates) ──▶ 127.0.0.1:4321  node dist/server/entry.mjs
```

> ⚠️ **Astro bakes the `.env` values into `dist/` at build time** — including the
> `service_role` key. Consequences:
> - always **build on the server**, with the server's `.env`;
> - never commit, copy or share `dist/`;
> - after changing any variable: **rebuild + restart** (a restart alone changes nothing).

---

## 0. What you need

- An OVHcloud VPS with Ubuntu 22.04 / 24.04 (OVH control panel → VPS → *Reinstall* to pick
  the image), its public IPv4, and SSH access (`ssh ubuntu@<server IP>`, password from the
  OVH email or your SSH key)
- Access to the DNS zone of `abordage-sud-sarthe.fr`
- The Supabase project (URL, anon key, service_role key, admin user UUID)
- Read access to the GitHub repo `Grizef/abordage` from the server
  (deploy key or personal access token if the repo is private)

## 1. DNS

Create two records pointing to the server's public IP:

```
abordage-sud-sarthe.fr        A   <server IP>
www.abordage-sud-sarthe.fr    A   <server IP>
```

Check from your computer: `nslookup abordage-sud-sarthe.fr` must return the server IP.
Wait for this before step 7 (Caddy needs it to get the certificate).

## 2. Firewall: allow only SSH, 80 and 443

OVH Ubuntu images ship with every port open, so turn on `ufw`
(allow SSH **first**, or you lock yourself out):

```bash
sudo apt-get update && sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status        # OpenSSH, 80, 443 → ALLOW
```

Do **not** open 4321: only Caddy talks to the app.

If you have also enabled OVH's **Network Firewall** (control panel → *Bare Metal Cloud → Network →
IP → ⋯ → Edge Network Firewall*), add rules there too: TCP 22, 80, 443 → accept. It is off by
default; if you never touched it, skip this.

## 3. Install Node.js 22 (≥ 22.12 required) and git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v   # must print v22.12.0 or higher
```

Below 22.12, saving an article and opening article pages crash with `ERR_REQUIRE_ESM`
(`sanitize-html` needs Node's native `require(esm)`).

## 4. Dedicated user and code

```bash
sudo adduser --system --group --home /srv/abordage abordage
sudo -u abordage git clone https://github.com/Grizef/abordage.git /srv/abordage/app
cd /srv/abordage/app
```

## 5. Environment file

```bash
sudo -u abordage cp .env.example .env
sudo -u abordage nano .env
sudo chmod 600 .env
```

Fill in:

| Variable | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_KEY` | Same page → `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key (**secret**) |
| `ADMIN_USER_ID` | Supabase → Authentication → Users → UUID of the admin account |
| `PUBLIC_CONTACT_FORM_ENDPOINT` | Your Formspree form URL (optional: falls back to mailto) |

Without `ADMIN_USER_ID`, `/admin` and every `/api/*` route refuse all requests (503).

## 6. Install dependencies and build

```bash
cd /srv/abordage/app
sudo -u abordage npm ci
sudo -u abordage npm run build
```

Must end with `[build] Complete!`.

## 7. Run the app with systemd

Create `/etc/systemd/system/abordage.service`:

```ini
[Unit]
Description=Abord'Âge website (Astro SSR)
After=network.target

[Service]
User=abordage
WorkingDirectory=/srv/abordage/app
Environment=HOST=127.0.0.1
Environment=PORT=4321
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server/entry.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now abordage
systemctl status abordage           # must be "active (running)"
curl -I http://127.0.0.1:4321/      # must return 200
```

## 8. HTTPS with Caddy

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

Replace the content of `/etc/caddy/Caddyfile` with:

```caddy
abordage-sud-sarthe.fr {
    encode gzip
    reverse_proxy 127.0.0.1:4321
}

www.abordage-sud-sarthe.fr {
    redir https://abordage-sud-sarthe.fr{uri} permanent
}
```

```bash
sudo systemctl reload caddy
```

Caddy gets and renews the Let's Encrypt certificates on its own.

## 9. Check it works

From your computer:

```bash
curl -I https://abordage-sud-sarthe.fr/
```
→ `200`, with `strict-transport-security` and `x-frame-options: DENY` headers.

```bash
curl -s https://abordage-sud-sarthe.fr/api/lister-actualites
```
→ `{"error":"Authentification requise."}` (the API is admin-only — this is correct).

Then in a browser:
1. `https://abordage-sud-sarthe.fr/actualites` lists the news.
2. `https://abordage-sud-sarthe.fr/admin` → log in → create, edit, delete a test article.

## 10. Supabase side (dashboard, once)

- **Authentication → URL Configuration**: Site URL = `https://abordage-sud-sarthe.fr`.
- **Table `news` → RLS enabled**: public `SELECT` only; no `INSERT/UPDATE/DELETE` for `anon`.
- **Rotate secrets** that leaked in Git history: change the admin account password,
  regenerate the keys if needed — then update `.env` and redo step 11.

## 11. Updating the site later

```bash
cd /srv/abordage/app
sudo -u abordage git pull
sudo -u abordage npm ci
sudo -u abordage npm run build
sudo systemctl restart abordage
```

Same procedure after editing `.env`.

## 12. Monitoring (optional)

Uptime Kuma + Beszel: see `monitoring/README.md` (branch `feat/monitoring`, not merged in
`master` yet). The `/api/health` check it relies on only exists once that branch is merged.

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Site unreachable, browser times out | Port 80/443 closed: `sudo ufw status`, and OVH Network Firewall if enabled (step 2) |
| Locked out of SSH after `ufw enable` | Use the OVH control panel → VPS → *KVM* console, then `sudo ufw allow OpenSSH` |
| `502 Bad Gateway` | App not running: `journalctl -u abordage -n 50` |
| `500` on article pages or when saving, `ERR_REQUIRE_ESM` in logs | Node < 22.12 (step 3) |
| `/admin` or API returns 503 "Administration non configurée" | `ADMIN_USER_ID` missing → fix `.env`, then rebuild (step 11) |
| Changed `.env` but nothing changed | Values are baked at build time → rebuild, then restart |
| Certificate error | DNS not pointing to the server yet (step 1); check `journalctl -u caddy -n 50` |
| `403 Origine non autorisée` on admin actions | Site opened from another domain than `https://abordage-sud-sarthe.fr` (e.g. raw IP) |
