# Monitoring de l'infrastructure

Surveillance en quasi temps réel du site et du serveur, avec accès mobile.

| Outil | Rôle | Accès mobile |
| :--- | :--- | :--- |
| **Uptime Kuma** | Disponibilité : site, routes `/api`, endpoint Supabase, expiration du certificat SSL | PWA installable + notifications push |
| **Beszel** | Métriques serveur : CPU, RAM, disque, réseau, conteneurs Docker | PWA installable + alertes |

Les deux sont auto-hébergés sur le serveur Oracle Cloud, à côté du site. Aucune app à publier sur les stores : ce sont des PWA, on les « installe » depuis le navigateur du téléphone (écran d'accueil).

---

## 1. Prérequis sur le serveur

- Docker + plugin Compose (`docker compose version`)
- Un reverse proxy déjà en place pour le site (nginx ou Caddy) — on ajoute juste des sous-domaines
- Accès à la zone DNS de `abordage-sud-sarthe.fr`

## 2. Sous-domaines DNS

Créer deux enregistrements `A` (ou `CNAME` vers le domaine principal) pointant sur l'IP publique du serveur :

```
status.abordage-sud-sarthe.fr    → <IP du serveur>
metrics.abordage-sud-sarthe.fr   → <IP du serveur>
```

## 3. Pare-feu Oracle Cloud — les DEUX niveaux

C'est le piège classique d'Oracle Cloud. Il faut ouvrir **80 et 443** (uniquement) à deux endroits :

**a) Security List / NSG du VCN** (console web Oracle)
`Networking → Virtual Cloud Networks → <ton VCN> → Security Lists → Default Security List → Add Ingress Rules`
- Source `0.0.0.0/0`, TCP, port `443`
- Source `0.0.0.0/0`, TCP, port `80`

**b) Pare-feu de l'OS** (sur la machine — les images Oracle Linux/Ubuntu bloquent tout par défaut)

```bash
# Ubuntu (iptables)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save

# ou Oracle Linux (firewalld)
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

> On n'ouvre **pas** les ports 3001 et 8090 : ils restent sur `127.0.0.1`, seul le reverse proxy y accède.

## 4. Reverse proxy

### Option Caddy (HTTPS automatique)

Ajouter au `Caddyfile` :

```caddy
status.abordage-sud-sarthe.fr {
    reverse_proxy 127.0.0.1:3001
}

metrics.abordage-sud-sarthe.fr {
    reverse_proxy 127.0.0.1:8090
}
```

### Option nginx

```nginx
server {
    listen 443 ssl;
    server_name status.abordage-sud-sarthe.fr;

    # ssl_certificate ... (certbot --nginx s'en occupe)

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # WebSocket : Uptime Kuma en a besoin
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
# idem pour metrics.abordage-sud-sarthe.fr → 127.0.0.1:8090
```

```bash
sudo certbot --nginx -d status.abordage-sud-sarthe.fr -d metrics.abordage-sud-sarthe.fr
```

## 5. Démarrage

```bash
cd monitoring
cp .env.example .env
docker compose up -d uptime-kuma beszel      # l'agent Beszel démarre à l'étape 7
```

- Uptime Kuma → https://status.abordage-sud-sarthe.fr
- Beszel → https://metrics.abordage-sud-sarthe.fr

À la première visite, chaque outil demande de créer le compte administrateur. **Fais-le tout de suite** (avant que quelqu'un d'autre ne tombe sur la page).

## 6. Configurer Uptime Kuma

Créer ces moniteurs (`+ Add New Monitor`) :

| Nom | Type | Cible | Intervalle |
| :--- | :--- | :--- | :--- |
| Site web | HTTP(s) | `https://abordage-sud-sarthe.fr` | 60 s |
| Santé applicative | HTTP(s) - Keyword | `https://abordage-sud-sarthe.fr/api/health`, mot-clé `"status":"ok"` | 60 s |
| API actualités | HTTP(s) - Keyword | `https://abordage-sud-sarthe.fr/api/lister-actualites`, mot-clé `success` | 300 s |
| Supabase | HTTP(s) | `https://<projet>.supabase.co/rest/v1/` + header `apikey: <clé anon>`, code attendu `200-299` | 120 s |
| Certificat SSL | (activé sur le moniteur « Site web ») | alerte à J-14 | — |

L'endpoint `/api/health` (ajouté dans ce dépôt, `src/pages/api/health.ts`) teste la connexion Supabase côté serveur et renvoie `503` si elle est cassée — c'est le check le plus utile.

## 7. Configurer Beszel

1. Dans le hub : `Add system` → nom `oracle-prod`, host `localhost`, port `45876`.
2. Copier la **Public key** affichée, la coller dans `monitoring/.env` :
   ```
   BESZEL_KEY="ssh-ed25519 AAAA..."
   ```
3. Démarrer l'agent :
   ```bash
   docker compose up -d beszel-agent
   ```
4. Le système passe au vert sous ~15 s. Régler les alertes (CPU, RAM, disque, statut) par système, onglet `Alerts`.

## 8. Notifications push sur le téléphone

Le plus simple, gratuit, sans compte : **ntfy**.

1. Installer l'app **ntfy** (iOS / Android), s'abonner à un topic au nom non devinable, ex. `abordage-alertes-7x9k2`.
2. **Uptime Kuma** → `Settings → Notifications → Add` → type `ntfy` → serveur `https://ntfy.sh` → topic `abordage-alertes-7x9k2`. Cocher la notif sur chaque moniteur.
3. **Beszel** → `Settings → Notifications` → ajouter une URL shoutrrr :
   `ntfy://ntfy.sh/abordage-alertes-7x9k2`

Alternative : **Telegram** (créer un bot via @BotFather, les deux outils le supportent nativement).

## 9. Installer les PWA sur le téléphone

- Ouvrir `https://status.abordage-sud-sarthe.fr` dans le navigateur mobile.
- iOS Safari : `Partager → Sur l'écran d'accueil`. Android Chrome : `⋮ → Ajouter à l'écran d'accueil`.
- Idem pour `metrics.abordage-sud-sarthe.fr`.

Tu as alors deux icônes qui se comportent comme des apps, avec notifications push.

## Sauvegarde

Les données vivent dans les volumes Docker `uptime-kuma` et `beszel_data`. Pour sauvegarder :

```bash
docker run --rm -v monitoring_uptime-kuma:/data -v "$PWD":/backup alpine \
  tar czf /backup/uptime-kuma-$(date +%F).tar.gz -C /data .
```

## Mise à jour

```bash
cd monitoring
docker compose pull
docker compose up -d
```
