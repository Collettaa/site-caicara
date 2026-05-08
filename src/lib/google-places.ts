export interface GoogleReview {
  author_name: string;
  author_url: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export async function getGoogleReviews(): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.warn("Google Places API Key or Place ID is missing in environment variables.");
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&language=pt-BR&key=${apiKey}`;
    
    // Revalidate once a day (86400 seconds) to save API calls
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      throw new Error("Failed to fetch Google Reviews");
    }

    const data = await res.json();

    if (data.result && data.result.reviews) {
      // Filter for 5-star reviews and sort by length or recency if needed
      const excellentReviews = data.result.reviews.filter(
        (review: GoogleReview) => review.rating >= 4 && review.text.length > 20
      );
      return excellentReviews;
    }

    return [];
  } catch (error) {
    console.error("Error fetching Google Reviews:", error);
    return [];
  }
}
