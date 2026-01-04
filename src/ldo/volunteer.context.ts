import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * volunteerContext: JSON-LD Context for volunteer
 * =============================================================================
 */
export const volunteerContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
  },
  VolunteerProfile: "https://id.volunteeringdata.io/volunteer-profile/VolunteerProfile",
  PreferredLocation: "https://id.volunteeringdata.io/volunteer-profile/PreferredLocation",
  Point: "https://id.volunteeringdata.io/volunteer-profile/Point",
  PreferredTime: "https://id.volunteeringdata.io/volunteer-profile/PreferredTime",
  preferredLocation: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/preferredLocation",
    "@type": "@id",
  },
  preferredTime: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/preferredTime",
    "@type": "@id",
  },
  hasSkill: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/hasSkill",
    "@type": "@id",
  },
  hasRequirement: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/hasRequirement",
    "@type": "@id",
  },
  preferredCause: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/preferredCause",
    "@type": "@id",
  },
  point: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/point",
    "@type": "@id",
  },
  rad: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/rad",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  lat: {
    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  long: {
    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#long",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal",
  },
  day: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/day",
    "@type": "@id",
  },
  time: {
    "@id": "https://id.volunteeringdata.io/volunteer-profile/time",
    "@type": "@id",
  },
};
