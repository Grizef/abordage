<div align="center">
  <img src="public/logo.png" alt="Abord'Âge Sud-Sarthe" width="140" />

  <h1>Abord'Âge Sud-Sarthe</h1>

  <p><em>Site web de l'association qui lutte contre l'isolement des personnes âgées dans le sud de la Sarthe.</em></p>

  <p>
    <img alt="Astro" src="https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" />
    <img alt="Node" src="https://img.shields.io/badge/Node-SSR-5FA04E?logo=nodedotjs&logoColor=white" />
  </p>

  <p>
    <a href="https://abordage-sud-sarthe.fr"><strong>abordage-sud-sarthe.fr</strong></a>
  </p>
</div>

---

## À propos

**Abord'Âge Sud-Sarthe** est une association loi 1901 qui s'inscrit dans le cadre du *bien vieillir*
et de la *prévention de la perte d'autonomie* des seniors. Elle propose des activités et des moments
de rencontre aux personnes de 65 ans et plus, isolées ou en manque de contacts sociaux, sur le
territoire du sud de la Sarthe.

Ce dépôt contient le code source du site vitrine de l'association : présentation, activités,
événements, actualités et témoignages, ainsi qu'une interface d'administration pour gérer les
actualités.

## Fonctionnalités

- 🏠 **Site vitrine** — pages de présentation, activités, actions, événements, à propos, contact
- 📰 **Actualités** — articles gérés en base de données, avec pages de détail générées dynamiquement
- 🔒 **Espace admin** (`/admin`) — création, modification et suppression des actualités via des routes API
- 📝 **Blog** — contenu Markdown / MDX avec temps de lecture
- 🔎 **SEO** — balises OpenGraph, URLs canoniques, `sitemap.xml`, `robots.txt`
- 📡 **Flux RSS** — `rss.xml`
- ♿ **Accessibilité** — police Atkinson Hyperlegible, contenu structuré

## Stack technique

| Domaine        | Outil                                             |
| :------------- | :------------------------------------------------ |
| Framework      | [Astro 5](https://astro.build) en mode `server` (SSR) |
| Adapter        | `@astrojs/node` (standalone)                      |
| Styles         | [Tailwind CSS 4](https://tailwindcss.com) (via plugin Vite) |
| Base de données| [Supabase](https://supabase.com) (PostgreSQL)     |
| Contenu        | Markdown / MDX, collections de contenu Astro      |
| Éditeur riche  | [Quill](https://quilljs.com)                      |

## Structure du projet

```text
src/
├── components/      Composants Astro (Header, Footer, Carousel, BaseHead…)
├── content/         Collections de contenu (actualités)
├── data/            Articles de blog en Markdown
├── layouts/         Gabarits de page (Layout, BlogPost)
├── lib/             Clients Supabase (client public + service role serveur)
├── pages/
│   ├── api/         Routes API des actualités (ajouter, get, lister, modifier, supprimer)
│   ├── actualites/  Liste et pages [slug]
│   ├── blog/        Index et pages [...slug]
│   └── *.astro      Pages du site (index, activites, evenements, contact…)
├── styles/          CSS global
└── consts.ts        Constantes du site (titre, URL, SEO)
public/              Images, polices, favicon, robots.txt
```

## Prérequis

- [Node.js](https://nodejs.org) 18 ou plus
- Un projet [Supabase](https://supabase.com) avec une table `actualites`

## Installation

```bash
git clone https://github.com/Grizef/abordage.git
cd abordage
npm install
```

Créez un fichier `.env` à la racine :

```dotenv
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role
```

> ⚠️ Ne commitez jamais le fichier `.env` ni de mots de passe. La clé `service_role` contourne
> les politiques RLS : elle ne doit rester que côté serveur.

## Commandes

Toutes les commandes se lancent à la racine du projet :

| Commande            | Action                                                |
| :------------------ | :---------------------------------------------------- |
| `npm install`       | Installe les dépendances                              |
| `npm run dev`       | Démarre le serveur de dev sur `localhost:4321`        |
| `npm run build`     | Compile le site de production dans `./dist/`          |
| `npm run preview`   | Prévisualise le build en local                        |
| `npm run astro ...` | Lance la CLI Astro (`astro add`, `astro check`…)      |

## Déploiement

Le site est construit en mode `server` avec l'adapter Node standalone :

```bash
npm run build
node ./dist/server/entry.mjs
```

Les variables d'environnement (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
doivent être définies sur l'hébergeur. Le site est servi depuis `https://abordage-sud-sarthe.fr`.

## Contact

Association Abord'Âge Sud-Sarthe — [abordage-sud-sarthe.fr](https://abordage-sud-sarthe.fr)
