export const SHOP_FONT_OPTIONS = [
  "Fraunces",
  "DM Sans",
  "Playfair Display",
  "Source Serif 4",
  "Libre Baskerville",
  "Space Grotesk",
  "Outfit",
  "Lora",
  "IBM Plex Sans",
  "Nunito",
] as const;

export function googleFontsHref(heading: string, body: string) {
  const families = [...new Set([heading, body])]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
