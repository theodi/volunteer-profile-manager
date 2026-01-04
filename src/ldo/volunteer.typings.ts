import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for volunteer
 * =============================================================================
 */

/**
 * VolunteerProfile Type
 */
export interface VolunteerProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Volunteer Profile type
   */
  type?: {
    "@id": "VolunteerProfile";
  };
  /**
   * Preferred locations for volunteering
   */
  preferredLocation?: LdSet<PreferredLocation>;
  /**
   * Preferred times for volunteering
   */
  preferredTime?: LdSet<PreferredTime>;
  /**
   * Skills the volunteer has
   */
  hasSkill?: LdSet<{
    "@id": string;
  }>;
  /**
   * Requirements the volunteer can fulfill
   */
  hasRequirement?: LdSet<{
    "@id": string;
  }>;
  /**
   * Causes the volunteer is interested in
   */
  preferredCause?: LdSet<{
    "@id": string;
  }>;
}

/**
 * PreferredLocation Type
 */
export interface PreferredLocation {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Preferred Location type
   */
  type?: {
    "@id": "PreferredLocation";
  };
  /**
   * Geographic point
   */
  point: Point;
  /**
   * Radius in km
   */
  rad: number;
}

/**
 * Point Type
 */
export interface Point {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Point type
   */
  type?: {
    "@id": "Point";
  };
  /**
   * Latitude
   */
  lat: number;
  /**
   * Longitude
   */
  long: number;
}

/**
 * PreferredTime Type
 */
export interface PreferredTime {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Preferred Time type
   */
  type?: {
    "@id": "PreferredTime";
  };
  /**
   * Day of the week
   */
  day: {
    "@id": string;
  };
  /**
   * Time of day
   */
  time: {
    "@id": string;
  };
}
