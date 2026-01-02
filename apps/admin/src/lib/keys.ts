export type UsersListParams = {
  limit?: number;
  offset?: number;
  searchValue?: string;
  searchField?: "name" | "email";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type SeriesListParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

export type ChaptersListParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
};

export type UserRole = "admin" | "user" | "editor" | "moderator";

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersList: (params?: UsersListParams) =>
    [...adminKeys.users(), "list", params] as const,
  series: () => [...adminKeys.all, "series"] as const,
  seriesList: (params?: SeriesListParams) =>
    [...adminKeys.series(), "list", params] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  media: () => [...adminKeys.all, "media"] as const,
  mediaStats: () => [...adminKeys.media(), "stats"] as const,
  mediaCovers: (params?: { limit?: number; offset?: number }) =>
    [...adminKeys.media(), "covers", params] as const,
  mediaPages: (params?: { limit?: number; offset?: number }) =>
    [...adminKeys.media(), "pages", params] as const,
  systemHealth: () => [...adminKeys.all, "system-health"] as const,
  settings: () => [...adminKeys.all, "settings"] as const,
  chapters: () => [...adminKeys.all, "chapters"] as const,
  chaptersList: (params?: ChaptersListParams) =>
    [...adminKeys.chapters(), "list", params] as const,
  genres: () => [...adminKeys.all, "genres"] as const,
} as const;
