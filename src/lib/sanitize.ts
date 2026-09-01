import sanitizeHtml from "sanitize-html";

/**
 * Assainit le HTML produit par l'éditeur de l'admin (QuillJS) avant stockage
 * et avant affichage. Liste blanche volontairement restreinte au sous-ensemble
 * qu'un article d'actualité peut légitimement contenir.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty ?? "", {
    allowedTags: [
      "p", "br", "hr", "span", "strong", "b", "em", "i", "u", "s",
      "blockquote", "code", "pre",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li",
      "a", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      span: ["class"],
      code: ["class"],
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
    disallowedTagsMode: "discard",
  });
}
