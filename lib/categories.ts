export const DEFAULT_CATEGORIES = [
  "Psicología clínica",
  "Neurocientífico",
  "Educativa",
  "Deportiva",
  "Psicología social",
  "Psicometría",
];

// Slug seguro para español: quita acentos, deja alfanumérico y guiones.
export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
