import type { $Fetch } from "ofetch";
import type {
  AddRatingInput,
  AddToLibraryInput,
  HistoryItem,
  LibraryItem,
  RatingItem,
  SuccessResponse,
  TrackHistoryInput,
  UpdateHistoryInput,
  UpdateLibraryInput,
  UpdateRatingInput,
  UpdateUserSettingsInput,
  UserSettings,
} from "../schemas";

export function createUsersDomain($fetch: $Fetch) {
  return {
    getLibrary() {
      return $fetch<LibraryItem[]>("/users/library");
    },

    getLibraryItem(seriesId: string) {
      return $fetch<LibraryItem>(`/users/library/${seriesId}`);
    },

    addToLibrary(data: AddToLibraryInput) {
      return $fetch<LibraryItem>("/users/library", {
        method: "POST",
        body: data,
      });
    },

    updateLibraryStatus(seriesId: string, data: UpdateLibraryInput) {
      return $fetch<LibraryItem>(`/users/library/${seriesId}`, {
        method: "PUT",
        body: data,
      });
    },

    removeFromLibrary(seriesId: string) {
      return $fetch<SuccessResponse>(`/users/library/${seriesId}`, {
        method: "DELETE",
      });
    },

    getHistory() {
      return $fetch<HistoryItem[]>("/users/library/history");
    },

    trackHistory(data: TrackHistoryInput) {
      return $fetch<HistoryItem>("/users/library/history", {
        method: "POST",
        body: data,
      });
    },

    updateHistory(seriesId: string, data: UpdateHistoryInput) {
      return $fetch<HistoryItem>(`/users/library/history/${seriesId}`, {
        method: "PUT",
        body: data,
      });
    },

    removeHistory(seriesId: string) {
      return $fetch<SuccessResponse>(`/users/library/history/${seriesId}`, {
        method: "DELETE",
      });
    },

    clearHistory() {
      return $fetch<SuccessResponse>("/users/library/history", {
        method: "DELETE",
      });
    },

    getRatings() {
      return $fetch<RatingItem[]>("/users/library/ratings");
    },

    getRating(seriesId: string) {
      return $fetch<RatingItem>(`/users/library/ratings/${seriesId}`);
    },

    addRating(data: AddRatingInput) {
      return $fetch<RatingItem>("/users/library/ratings", {
        method: "POST",
        body: data,
      });
    },

    updateRating(seriesId: string, data: UpdateRatingInput) {
      return $fetch<RatingItem>(`/users/library/ratings/${seriesId}`, {
        method: "PUT",
        body: data,
      });
    },

    removeRating(seriesId: string) {
      return $fetch<SuccessResponse>(`/users/library/ratings/${seriesId}`, {
        method: "DELETE",
      });
    },

    getSettings() {
      return $fetch<UserSettings>("/users/settings");
    },

    updateSettings(data: UpdateUserSettingsInput) {
      return $fetch<UserSettings>("/users/settings", {
        method: "PUT",
        body: data,
      });
    },
  };
}

export type UsersDomain = ReturnType<typeof createUsersDomain>;
