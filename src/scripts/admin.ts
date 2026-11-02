import { createClient } from "@supabase/supabase-js";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const root = document.getElementById("admin-app");
const headerActions = document.getElementById("header-actions");

const SUPABASE_URL = root?.dataset.supabaseUrl ?? "";
const SUPABASE_KEY = root?.dataset.supabaseKey ?? "";
const ADMIN_USER_ID = root?.dataset.adminId ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let quill: Quill | null = null;
let currentEditSlug: string | null = null;

async function authHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = { ...extra };
  if (session?.access_token)
    headers["Authorization"] = `Bearer ${session.access_token}`;
  return headers;
}

async function isAdmin(): Promise<boolean> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return !error && session?.user?.id === ADMIN_USER_ID;
}

async function logout(): Promise<void> {
  await supabase.auth.signOut();
  location.reload();
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c]!;
  });

function renderLogin(): void {
  if (!root) return;
  root.innerHTML = `
    <div class="admin-card">
      <h2 class="page-title">Connexion Admin</h2>
      <div class="divider"></div>
      <form id="login-form">
        <div class="form-group">
          <label class="sr-only" for="email">Email</label>
          <input type="email" id="email" placeholder="Email" required class="form-input" autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="sr-only" for="password">Mot de passe</label>
          <input type="password" id="password" placeholder="Mot de passe" required class="form-input" autocomplete="current-password" />
        </div>
        <div class="form-group">
          <button type="submit" class="btn-primary">Se connecter</button>
        </div>
        <p id="login-message" class="admin-message" role="alert"></p>
      </form>
    </div>`;

  const form = document.getElementById("login-form") as HTMLFormElement | null;
  const msg = document.getElementById("login-message");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      if (msg) {
        msg.textContent = "Erreur de connexion. Vérifiez vos identifiants.";
        msg.style.color = "red";
      }
      return;
    }
    if (data.user.id === ADMIN_USER_ID) {
      location.reload();
    } else {
      if (msg) {
        msg.textContent = "Accès non autorisé. Vous n'êtes pas administrateur.";
        msg.style.color = "red";
      }
      await supabase.auth.signOut();
    }
  });
}

interface NewsItem {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
}

async function renderAdmin(): Promise<void> {
  if (!root) return;

  if (headerActions) {
    headerActions.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "logout-btn";
    btn.textContent = "Déconnexion";
    btn.addEventListener("click", logout);
    headerActions.appendChild(btn);
  }

  let items: NewsItem[] = [];
  try {
    const res = await fetch("/api/lister-actualites", {
      headers: await authHeaders(),
    });
    const json = await res.json();
    if (json.success) items = json.list;
  } catch (err) {
    console.warn("Impossible de récupérer les actualités", err);
  }

  const listHtml = items
    .map(
      (a) => `
      <div class="admin-news-item" data-slug="${escapeHtml(a.slug)}">
        <div>
          <strong>${escapeHtml(a.title)}</strong>
          <span style="color:#888;">(${escapeHtml(a.publishDate ?? "")})</span><br />
          <span style="font-size:0.95em;">${escapeHtml(a.description ?? "")}</span>
        </div>
        <div class="admin-news-actions">
          <button class="edit-btn" data-slug="${escapeHtml(a.slug)}">Modifier</button>
          <button class="delete-btn" data-slug="${escapeHtml(a.slug)}">Supprimer</button>
        </div>
      </div>`,
    )
    .join("");

  root.innerHTML = `
    <div class="admin-grid">
      <div class="admin-left">
        <div class="admin-card">
          <h2 class="page-title">Actualités existantes</h2>
          <div class="admin-news-list">${listHtml}</div>
        </div>
      </div>
      <aside class="admin-right">
        <div class="admin-card">
          <h2 class="section-title">Écrire une nouvelle actualité</h2>
          <div class="divider"></div>
          <form id="news-form">
            <div class="form-group">
              <label class="sr-only" for="titre">Titre</label>
              <input type="text" id="titre" placeholder="Titre" required class="form-input" />
            </div>
            <div class="form-group"><div id="editor"></div></div>
            <div class="form-group">
              <button type="submit" class="btn-primary">Publier</button>
            </div>
          </form>
          <div class="form-group">
            <p id="news-message" class="admin-message" role="status"></p>
          </div>
        </div>
      </aside>
    </div>`;

  root.querySelectorAll<HTMLButtonElement>(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const slug = btn.dataset.slug!;
      if (!confirm("Confirmer la suppression ?")) return;
      try {
        const res = await fetch("/api/supprimer-actualite", {
          method: "POST",
          headers: await authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ slug }),
        });
        const j = await res.json();
        if (j.success) {
          root
            .querySelector(`.admin-news-item[data-slug="${CSS.escape(slug)}"]`)
            ?.remove();
        } else {
          alert(j.error || "Erreur lors de la suppression");
        }
      } catch {
        alert("Erreur lors de la suppression côté serveur");
      }
    });
  });

  root.querySelectorAll<HTMLButtonElement>(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const slug = btn.dataset.slug!;
      try {
        const res = await fetch("/api/get-actualite", {
          method: "POST",
          headers: await authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ slug }),
        });
        const j = await res.json();
        if (!j.success) {
          alert("Impossible de charger l'actualité");
          return;
        }
        const titre = document.getElementById(
          "titre",
        ) as HTMLInputElement | null;
        if (titre) titre.value = j.frontmatter?.title ?? "";
        if (quill) quill.clipboard.dangerouslyPasteHTML(j.content ?? "");
        currentEditSlug = slug;
        titre?.scrollIntoView({ behavior: "smooth" });
      } catch {
        alert("Erreur lors du chargement de l'actualité");
      }
    });
  });

  const editor = document.getElementById("editor");
  if (editor && !quill) {
    quill = new Quill(editor, {
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          ["link", "code-block"],
        ],
      },
      theme: "snow",
    });
  }

  const form = document.getElementById("news-form") as HTMLFormElement | null;
  const msg = document.getElementById("news-message");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = (document.getElementById("titre") as HTMLInputElement).value;
    const contenu = quill?.root.innerHTML ?? "";
    const plain = quill?.getText().trim() ?? "";
    const autoDescription =
      plain.substring(0, 150).trim() + (plain.length > 150 ? "…" : "");
    const publishDate = new Date().toISOString().split("T")[0];
    const editSlug = currentEditSlug;

    try {
      const url = editSlug
        ? "/api/modifier-actualite"
        : "/api/ajouter-actualite";
      const payload = editSlug
        ? {
            slug: editSlug,
            title,
            description: autoDescription,
            contenu,
            publishDate,
          }
        : { title, description: autoDescription, contenu, publishDate };
      const res = await fetch(url, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!msg) return;
      if (result.success) {
        msg.textContent = editSlug
          ? "Actualité modifiée !"
          : "Actualité publiée !";
        msg.style.color = "green";
        currentEditSlug = null;
        form.reset();
        quill?.setText("");
        setTimeout(() => {
          renderAdmin();
        }, 800);
      } else {
        msg.textContent = result.error || "Erreur inconnue.";
        msg.style.color = "red";
      }
    } catch {
      if (msg) {
        msg.textContent = "Erreur réseau ou serveur.";
        msg.style.color = "red";
      }
    }
  });
}

(async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !ADMIN_USER_ID) {
    if (root) root.textContent = "Configuration admin incomplète.";
    return;
  }
  if (await isAdmin()) {
    renderAdmin();
  } else {
    renderLogin();
  }
})();
