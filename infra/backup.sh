#!/usr/bin/env bash
# Sauvegarde quotidienne de la plateforme : NPM (config + certificats), Uptime Kuma, Portainer,
# compose.yaml et .env des sites. Le code des sites est dans Git, leurs données dans Supabase.
# Chiffrée avec age pour les clés SSH publiques de /opt/backups/recipients.txt : seule la clé
# privée (sur votre PC) peut la relire. Installé dans /opt/scripts/backup.sh, lancé par backup.timer.
set -euo pipefail

DEST=/opt/backups
RECIPIENTS="$DEST/recipients.txt"
KEEP_DAYS=14
CONTAINERS=(npm uptime-kuma portainer)
PUSH_URL_FILE=/etc/backup-push-url   # facultatif : URL « Push » d'un moniteur Uptime Kuma

[[ -s "$RECIPIENTS" ]] || { echo "aucune clé publique dans $RECIPIENTS" >&2; exit 1; }
OUT="$DEST/vps-$(date +%F-%H%M).tar.gz.age"

# Conteneurs gelés le temps de l'archive pour des bases SQLite cohérentes
# (sites injoignables quelques secondes, d'où l'exécution de nuit).
docker pause "${CONTAINERS[@]}" > /dev/null
trap 'docker unpause "${CONTAINERS[@]}" > /dev/null 2>&1 || true' EXIT
cd /opt
tar -czf - proxy-manager uptime-kuma portainer websites/*/compose.yaml websites/*/.env \
  | age -R "$RECIPIENTS" > "$OUT.tmp"
docker unpause "${CONTAINERS[@]}" > /dev/null
trap - EXIT

mv "$OUT.tmp" "$OUT"
chmod 644 "$OUT"   # chiffré : lisible par ubuntu pour le téléchargement par scp
find "$DEST" -name 'vps-*.tar.gz.age' -mtime +"$KEEP_DAYS" -delete

echo "OK : $OUT ($(du -h "$OUT" | cut -f1))"
if [[ -r "$PUSH_URL_FILE" ]]; then
  curl -fsS -m 10 "$(cat "$PUSH_URL_FILE")" > /dev/null || echo "Uptime Kuma injoignable" >&2
fi
