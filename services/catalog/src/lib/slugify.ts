import removeAccents from "remove-accents";
import slugify from "slugify";

export function createSlug(text: string): string {
  return slugify(removeAccents(text), {
    lower: true,
    strict: true,
    trim: true,
  });
}
