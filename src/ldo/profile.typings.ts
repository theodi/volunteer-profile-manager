import { LdoJsonldContext, LdSet } from "@ldo/ldo";

/**
 * =============================================================================
 * Typescript Typings for profile
 * =============================================================================
 */

/**
 * WebIdProfile Type
 */
export interface WebIdProfile {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Person type
   */
  type?: {
    "@id": "Person";
  };
  /**
   * Full name
   */
  name?: string;
  /**
   * Formatted name (vCard)
   */
  fn?: string;
  /**
   * Given name
   */
  givenName?: string;
  /**
   * Family name
   */
  familyName?: string;
  /**
   * Image URL
   */
  img?: {
    "@id": string;
  };
  /**
   * Depiction URL
   */
  depiction?: {
    "@id": string;
  };
  /**
   * Photo URL (vCard)
   */
  hasPhoto?: {
    "@id": string;
  };
  /**
   * Address
   */
  hasAddress?: Address;
}

/**
 * Address Type
 */
export interface Address {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Address type
   */
  type?: {
    "@id": "Address";
  };
  /**
   * Street address
   */
  "street-address"?: string;
  /**
   * Locality (city/town)
   */
  locality?: string;
  /**
   * Region (state/province)
   */
  region?: string;
  /**
   * Postal code
   */
  "postal-code"?: string;
  /**
   * Country name
   */
  "country-name"?: string;
  /**
   * Geographic coordinates
   */
  hasGeo?: Geo;
}

/**
 * Geo Type
 */
export interface Geo {
  "@id"?: string;
  "@context"?: LdoJsonldContext;
  /**
   * Geo type
   */
  type?: {
    "@id": "Geo";
  };
  /**
   * Latitude
   */
  latitude?: string;
  /**
   * Longitude
   */
  longitude?: string;
}
