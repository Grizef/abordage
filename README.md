<div align="center">
  <img src="public/logo.png" alt="Abord'Âge Sud-Sarthe" width="140" />
  <h1>Abord'Âge Sud-Sarthe</h1>
  <p><em>Site de l'association qui lutte contre l'isolement des personnes âgées dans le sud de la Sarthe.</em></p>
  <p><a href="https://abordage-sud-sarthe.fr"><strong>abordage-sud-sarthe.fr</strong></a></p>
</div>

---

## Stack

| Élément | Détail |
| --- | --- |
| Framework | [Astro 5](https://astro.build) en mode `server` (SSR) |
| Hébergement | Node standalone (`@astrojs/node`) |
| Base de données | [Supabase](https://supabase.com) — table `news` (actualités) |
| Éditeur d'actualités | QuillJS, page `/admin` protégée |
| Styles | CSS maison (`src/styles/global.css`) + styles scopés par composant |

## Démarrage

```sh
npm install
cp .env.example .env   # puis renseigner les valeurs
npm run dev            # http://localhost:4321
```

### Variables d'environnement

Voir [`.env.example`](.env.example). Toutes sont **obligatoires** pour lancer le serveur :

| Variable | Rôle |
| --- | --- |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_KEY` | Clé publique (anon) — pages publiques |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role — **serveur uniquement** |
| `ADMIN_USER_ID` | UUID de l'utilisateur Supabase autorisé sur `/admin` |
| `PUBLIC_CONTACT_FORM_ENDPOINT` | Endpoint du formulaire de contact (optionnel) |

## Commandes

| Commande | Action |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production dans `./dist/` |
| `npm run preview` | Prévisualisation du build |
| `npx astro check` | Vérification des types |

## Architecture

```
src/
├── components/   Header, Footer, Carousel, BaseHead…
├── layouts/      Layout.astro (gabarit commun)
├── lib/          clients Supabase, auth, assainissement HTML
├── middleware.ts auth des routes /api/*, en-têtes de sécurité
├── pages/
│   ├── api/      CRUD des actualités (admin uniquement)
│   ├── actualites/  liste + [slug] (lus depuis Supabase)
│   └── *.astro   pages vitrine
├── scripts/      admin.ts (logique de la page /admin, bundélisée)
└── styles/       global.css
```

## Sécurité

- Les routes `/api/*` exigent un JWT Supabase valide correspondant à `ADMIN_USER_ID`
  (vérifié dans `src/middleware.ts`).
- Le HTML des actualités est assaini (`sanitize-html`) à l'écriture et à l'affichage.
- CSP stricte (hachages par ressource) générée par Astro + en-têtes de sécurité
  ajoutés par le middleware.
- **RLS Supabase** : à vérifier côté tableau de bord (lecture publique restreinte,
  écriture réservée à l'admin).
