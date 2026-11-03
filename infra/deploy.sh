#!/usr/bin/env bash
# Déploie /opt/websites/<site> au commit <sha>, revient à l'image précédente si le conteneur
# ne passe pas « healthy ». Installé dans /opt/scripts/deploy.sh (root:root, 755).
# Appelé par GitHub Actions via la clé SSH à commande forcée de l'utilisateur deploy :
#   sudo /opt/scripts/deploy.sh <site> <sha>
# Convention : le service compose a container_name = <site> et image = <site>:latest.
# Le dépôt est public : ne rien afficher qui puisse contenir un secret (pas de logs du conteneur).
set -euo pipefail

SITE="${1:-}"
SHA="${2:-}"
[[ "$SITE" =~ ^site-[a-z0-9-]+$ ]] || { echo "nom de site invalide" >&2; exit 2; }
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "commit invalide (SHA complet attendu)" >&2; exit 2; }
DIR="/opt/websites/$SITE"
[[ -f "$DIR/compose.yaml" ]] || { echo "site inconnu : $SITE" >&2; exit 2; }
cd "$DIR"

exec 9>"/run/lock/deploy-$SITE.lock"
flock -n 9 || { echo "un déploiement de $SITE est déjà en cours" >&2; exit 1; }

wait_healthy() {
  local status
  for _ in $(seq 1 45); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$SITE" 2>/dev/null || echo absent)
    [[ "$status" == healthy ]] && return 0
    sleep 2
  done
  return 1
}

PREV_SHA=$(git rev-parse HEAD)
git fetch --quiet origin
git checkout --quiet --detach "$SHA"

if docker image inspect "$SITE:latest" > /dev/null 2>&1; then
  docker tag "$SITE:latest" "$SITE:previous"
fi

if ! docker compose build --quiet; then
  git checkout --quiet --detach "$PREV_SHA"
  echo "ÉCHEC du build : le site en ligne n'a pas changé" >&2
  exit 1
fi

docker compose up -d --no-build
if wait_healthy; then
  docker image prune -f > /dev/null
  echo "OK : $SITE déployé au commit $SHA"
  exit 0
fi

echo "La nouvelle version n'est pas healthy : retour à $PREV_SHA" >&2
echo "Diagnostic sur le VPS : sudo docker logs $SITE" >&2
docker tag "$SITE:previous" "$SITE:latest"
git checkout --quiet --detach "$PREV_SHA"
docker compose up -d --no-build
if wait_healthy; then
  echo "Retour arrière réussi" >&2
else
  echo "ÉCHEC du retour arrière : intervention manuelle nécessaire" >&2
fi
exit 1
