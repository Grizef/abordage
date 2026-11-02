# Graph Report - abordage  (2026-10-30)

## Corpus Check
- Corpus is ~10,166 words - fits in a single context window. You may not need a graph.

## Summary
- 187 nodes · 256 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 1% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 86,194 input · 0 output

## Community Hubs (Navigation)
- Dependencies & Build Config
- Site Metadata & Head
- Layout & Public Pages
- Monitoring Compose Services
- Monitoring Infrastructure Docs
- Actualites API & Supabase
- Content Collections & Nav
- Astro Starter Docs & SEO
- Beszel Agent Config
- TypeScript Config
- Image Carousel

## God Nodes (most connected - your core abstractions)
1. `Uptime Kuma` - 12 edges
2. `Astro Starter Kit: Blog` - 8 edges
3. `Beszel` - 8 edges
4. `beszel-agent` - 7 edges
5. `astro` - 7 edges
6. `supabaseServer` - 7 edges
7. `uptime-kuma` - 6 edges
8. `beszel` - 6 edges
9. `scripts` - 5 edges
10. `SITE_TITLE` - 5 edges

## Surprising Connections (you probably didn't know these)
- `sitemap.xml (abordage-sud-sarthe.fr)` --references--> `abordage-sud-sarthe.fr`  [INFERRED]
  public/robots.txt → monitoring/README.md
- `Actualite: premier test` --shares_data_with--> `/api/lister-actualites endpoint`  [AMBIGUOUS]
  src/content/actualites/premier-test.md → monitoring/README.md
- `Actualite: rrrrr` --shares_data_with--> `/api/lister-actualites endpoint`  [AMBIGUOUS]
  src/content/actualites/rrrrr.md → monitoring/README.md
- `Actualite: premier test` --implements--> `Astro Content Collections (getCollection)`  [INFERRED]
  src/content/actualites/premier-test.md → README.md
- `Actualite: rrrrr` --implements--> `Astro Content Collections (getCollection)`  [INFERRED]
  src/content/actualites/rrrrr.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Self-hosted monitoring stack on Oracle Cloud** — monitoring_readme_uptime_kuma, monitoring_readme_beszel, monitoring_readme_beszel_agent, monitoring_readme_reverse_proxy, monitoring_readme_docker_compose, monitoring_readme_oracle_cloud [EXTRACTED 1.00]
- **Application health check chain** — monitoring_readme_uptime_kuma, monitoring_readme_api_health, monitoring_readme_supabase, monitoring_readme_ntfy [EXTRACTED 1.00]
- **Actualites content collection entries** — src_content_actualites_premier_test_premier_test, src_content_actualites_rrrrr_rrrrr, readme_content_collections [INFERRED 0.75]

## Communities (13 total, 3 thin omitted)

### Community 0 - "Dependencies & Build Config"
Cohesion: 0.07
Nodes (38): dependencies, @astrojs/mdx@^4.2.5, @astrojs/node@^9.4.3, @astrojs/rss@^4.0.11, @astrojs/sitemap@^3.3.1, quill@^1.3.7, reading-time@^1.5.0, @supabase/supabase-js@^2.89.0 (+30 more)

### Community 1 - "Site Metadata & Head"
Cohesion: 0.14
Nodes (12): Props, Props, DEFAULT_OG_IMAGE, ORG_LOGO, ORG_NAME, SITE_DESCRIPTION, SITE_LANG, SITE_TITLE (+4 more)

### Community 2 - "Layout & Public Pages"
Cohesion: 0.10
Nodes (5): today, Props, { title = SITE_TITLE, description = SITE_DESCRIPTION, permalink }, supabase, prerender

### Community 3 - "Monitoring Compose Services"
Cohesion: 0.12
Nodes (16): container_name, image, ports, restart, volumes, services, beszel, uptime-kuma (+8 more)

### Community 4 - "Monitoring Infrastructure Docs"
Cohesion: 0.19
Nodes (15): abordage-sud-sarthe.fr, /api/health endpoint (src/pages/api/health.ts), Beszel, Beszel agent (oracle-prod, port 45876), DNS subdomains status./metrics.abordage-sud-sarthe.fr, Docker Compose stack (monitoring), Docker volume backup (uptime-kuma, beszel_data), Monitoring de l'infrastructure (+7 more)

### Community 5 - "Actualites API & Supabase"
Cohesion: 0.17
Nodes (3): supabaseServer, prerender, prerender

### Community 6 - "Content Collections & Nav"
Cohesion: 0.14
Nodes (9): astro@^5.7.9, astro, pathname, Props, subpath, actualites, blog, collections (+1 more)

### Community 7 - "Astro Starter Docs & SEO"
Cohesion: 0.15
Nodes (11): /api/lister-actualites endpoint, sitemap.xml (abordage-sud-sarthe.fr), Astro, Astro Starter Kit: Blog, Bear Blog, npm scripts (dev, build, preview), RSS Feed support, SEO canonical URLs and OpenGraph (+3 more)

### Community 8 - "Beszel Agent Config"
Cohesion: 0.22
Nodes (9): container_name, environment, image, network_mode, restart, volumes, KEY, LISTEN (+1 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.29
Nodes (6): astro/tsconfigs/strict, compilerOptions, strictNullChecks, exclude, extends, include

## Ambiguous Edges - Review These
- `/api/lister-actualites endpoint` → `Actualite: premier test`  [AMBIGUOUS]
  src/content/actualites/premier-test.md · relation: shares_data_with
- `/api/lister-actualites endpoint` → `Actualite: rrrrr`  [AMBIGUOUS]
  src/content/actualites/rrrrr.md · relation: shares_data_with

## Knowledge Gaps
- **8 isolated node(s):** `astro/tsconfigs/strict`, `Astro`, `RSS Feed support`, `SEO canonical URLs and OpenGraph`, `Bear Blog` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 81 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `astro` connect `Content Collections & Nav` to `Dependencies & Build Config`, `Actualites API & Supabase`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `Astro`, `RSS Feed support` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependencies & Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.07179487179487179 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `Dependencies & Build Config` to `Layout & Public Pages`, `Actualites API & Supabase`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `Site Metadata & Head` be split into smaller, more focused modules?**
  _Cohesion score 0.13846153846153847 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `/api/lister-actualites endpoint` and `Actualite: premier test`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `/api/lister-actualites endpoint` and `Actualite: rrrrr`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._