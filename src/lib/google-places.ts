import { siteConfig } from "@/lib/site";

export const GOOGLE_REVIEWS_REVALIDATE_SECONDS = 60 * 60;

export type GoogleReviewsSourceStatus = "error" | "invalid-key" | "missing-config" | "ok";

export interface GoogleReviewCandidate {
  authorName: string;
  authorUrl: string;
  googleMapsUri: string;
  profilePhotoUrl: string;
  publishTime: number;
  rating: number;
  relativeTimeDescription: string;
  text: string;
}

export interface GoogleReviewCard {
  authorName: string;
  authorUrl: string;
  googleMapsUri: string;
  profilePhotoUrl: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
}

interface GoogleReviewsSourceResult {
  googleMapsUri: string;
  placeName: string;
  rating: number | null;
  reviews: GoogleReviewCandidate[];
  sourceStatus: GoogleReviewsSourceStatus;
  userRatingCount: number | null;
}

export interface GoogleReviewsApiResponse {
  googleMapsUri: string;
  googleReviewUrl: string;
  placeName: string;
  rating: number | null;
  reviews: GoogleReviewCard[];
  sourceStatus: GoogleReviewsSourceStatus;
  status: "fallback" | "ok";
  userRatingCount: number | null;
}

type PlaceDetailsResponse = {
  displayName?: {
    text?: string;
  };
  error?: {
    details?: Array<{
      metadata?: {
        service?: string;
      };
      reason?: string;
    }>;
    message?: string;
    status?: string;
  };
  googleMapsUri?: string;
  rating?: number;
  reviews?: Array<{
    authorAttribution?: {
      displayName?: string;
      photoUri?: string;
      uri?: string;
    };
    googleMapsUri?: string;
    publishTime?: string;
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: {
      text?: string;
    };
  }>;
  userRatingCount?: number;
};

const PLACE_DETAILS_FIELD_MASK =
  "displayName,googleMapsUri,rating,reviews.relativePublishTimeDescription,reviews.text,reviews.rating,reviews.publishTime,reviews.authorAttribution,reviews.googleMapsUri,userRatingCount";

function getGoogleReviewUrl() {
  return process.env.GOOGLE_PLACE_ID
    ? `https://search.google.com/local/writereview?placeid=${process.env.GOOGLE_PLACE_ID}`
    : siteConfig.googleMapsUrl;
}

function getBaseReviewsResult(
  sourceStatus: GoogleReviewsSourceStatus,
  placeName = siteConfig.name,
): GoogleReviewsSourceResult {
  return {
    sourceStatus,
    placeName,
    rating: null,
    userRatingCount: null,
    googleMapsUri: siteConfig.googleMapsUrl,
    reviews: [],
  };
}

function normalizeReview(
  review: NonNullable<PlaceDetailsResponse["reviews"]>[number],
  defaultGoogleMapsUri: string,
): GoogleReviewCandidate {
  const text = review.text?.text?.trim() ?? "";
  const publishTime = review.publishTime ? Date.parse(review.publishTime) : 0;

  return {
    authorName: review.authorAttribution?.displayName ?? "Aluno Caiçara",
    authorUrl: review.authorAttribution?.uri ?? defaultGoogleMapsUri,
    googleMapsUri: review.googleMapsUri ?? defaultGoogleMapsUri,
    profilePhotoUrl: review.authorAttribution?.photoUri ?? "",
    publishTime: Number.isFinite(publishTime) ? publishTime : 0,
    rating: review.rating ?? 0,
    relativeTimeDescription: review.relativePublishTimeDescription ?? "",
    text,
  };
}

function isInvalidApiKeyResponse(data: PlaceDetailsResponse): boolean {
  const errorReasons = data.error?.details?.map((detail) => detail.reason ?? "") ?? [];
  const errorMessage = `${data.error?.status ?? ""} ${data.error?.message ?? ""}`.toLowerCase();

  return (
    errorReasons.some((reason) =>
      ["API_DISABLED", "API_KEY_INVALID", "API_KEY_SERVICE_BLOCKED", "API_KEY_HTTP_REFERRER_BLOCKED"].includes(
        reason,
      ),
    ) ||
    errorMessage.includes("api key") ||
    errorMessage.includes("key not valid")
  );
}

export function selectFeaturedGoogleReviews(reviews: GoogleReviewCandidate[]): GoogleReviewCard[] {
  return reviews
    .filter((review) => review.rating >= 4 && review.text.length >= 40)
    .sort(
      (first, second) =>
        second.rating - first.rating ||
        second.text.length - first.text.length ||
        second.publishTime - first.publishTime,
    )
    .slice(0, 3)
    .map(({ authorName, authorUrl, googleMapsUri, profilePhotoUrl, rating, relativeTimeDescription, text }) => ({
      authorName,
      authorUrl,
      googleMapsUri,
      profilePhotoUrl,
      rating,
      relativeTimeDescription,
      text,
    }));
}

export async function getGoogleReviewsSource(): Promise<GoogleReviewsSourceResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.warn("[Google Reviews] GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID is missing.");
    return getBaseReviewsResult("missing-config");
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`;
    const response = await fetch(url, {
      cache: "force-cache",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
      },
      next: { revalidate: GOOGLE_REVIEWS_REVALIDATE_SECONDS },
    });

    const data = (await response.json()) as PlaceDetailsResponse;

    if (!response.ok) {
      if (isInvalidApiKeyResponse(data)) {
        console.error("[Google Reviews] The Places API key is invalid or not enabled for Places API (New).");
        return getBaseReviewsResult("invalid-key", data.displayName?.text ?? siteConfig.name);
      }

      throw new Error(data.error?.message ?? "Failed to fetch Google reviews.");
    }

    const googleMapsUri = data.googleMapsUri ?? siteConfig.googleMapsUrl;

    return {
      sourceStatus: "ok",
      placeName: data.displayName?.text ?? siteConfig.name,
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
      googleMapsUri,
      reviews: (data.reviews ?? []).map((review) => normalizeReview(review, googleMapsUri)),
    };
  } catch (error) {
    console.error("[Google Reviews] Error fetching Google reviews:", error);
    return getBaseReviewsResult("error");
  }
}

export async function getGoogleReviews(): Promise<GoogleReviewsApiResponse> {
  const source = await getGoogleReviewsSource();
  const reviews = selectFeaturedGoogleReviews(source.reviews);

  return {
    status: source.sourceStatus === "ok" && reviews.length > 0 ? "ok" : "fallback",
    sourceStatus: source.sourceStatus,
    placeName: source.placeName,
    rating: source.rating,
    userRatingCount: source.userRatingCount,
    googleMapsUri: source.googleMapsUri,
    googleReviewUrl: getGoogleReviewUrl(),
    reviews,
  };
}
