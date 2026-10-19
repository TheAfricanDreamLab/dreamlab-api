/** Event types the catalog publishes on the `dreamlab.events` exchange (also the routing keys). */
export const CatalogEvents = {
  CoursePublished: 'course.published',
  CourseListingChanged: 'course.listing_changed',
} as const;
