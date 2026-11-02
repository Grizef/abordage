# Monitoring de l'infrastructure

Surveillance en quasi temps réel du site et du serveur, avec accès mobile.

| Outil | Rôle | Accès mobile |
| :--- | :--- | :--- |
| **Uptime Kuma** | Disponibilité : site, routes `/api`, endpoint Supabase, expiration du certificat SSL | PWA installable + notifications push |
| **Beszel** | Métriques serveur : CPU, RAM, disque, réseau, conteneurs Docker | PWA installable + alertes |

Les deux sont auto-hébergés sur le VPS OVHcloud, à côté du site. Aucune app à publier sur les stores : ce sont des PWA, on les « installe » depuis le navigateur du téléphone (écran d'accueil).

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

## 3. Pare-feu (VPS OVHcloud, `ufw`)

Si le site a été installé avec [`DEPLOY.md`](../DEPLOY.md), `ufw` est déjà actif avec SSH, 80 et 443
ouverts. Sinon :

```bash
sudo ufw allow OpenSSH      # en PREMIER, sinon on se coupe l'accès SSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Ajout spécifique au monitoring : le hub Beszel (conteneur) doit joindre l'agent sur l'hôte
(port `45876`). `ufw` filtre aussi ce trafic venant de Docker ; on l'autorise **uniquement
depuis les réseaux Docker**, pas depuis Internet :

```bash
sudo ufw allow from 172.16.0.0/12 to any port 45876 proto tcp
```

> On n'ouvre **pas** 3001, 8090 ni 45876 au public : 3001 et 8090 restent sur `127.0.0.1`,
> seul le reverse proxy y accède.

Si le **Network Firewall** OVH est activé sur l'IP du VPS (désactivé par défaut), y autoriser
aussi TCP 22, 80 et 443.

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

1. Dans le hub : `Add system` → nom `ovh-prod`, host `host.docker.internal`, port `45876`.
   (Pas `localhost` : dans le conteneur du hub, `localhost` désigne le conteneur lui-même,
   pas le serveur.)
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
