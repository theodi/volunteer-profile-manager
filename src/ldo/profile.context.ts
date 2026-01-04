import { LdoJsonldContext } from "@ldo/ldo";

/**
 * =============================================================================
 * profileContext: JSON-LD Context for profile
 * =============================================================================
 */
export const profileContext: LdoJsonldContext = {
  type: {
    "@id": "@type",
  },
  Person: "http://xmlns.com/foaf/0.1/Person",
  Address: "http://www.w3.org/2006/vcard/ns#Address",
  Geo: "http://www.w3.org/2006/vcard/ns#Geo",
  name: {
    "@id": "http://xmlns.com/foaf/0.1/name",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  fn: {
    "@id": "http://www.w3.org/2006/vcard/ns#fn",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  givenName: {
    "@id": "http://xmlns.com/foaf/0.1/givenName",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  familyName: {
    "@id": "http://xmlns.com/foaf/0.1/familyName",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  img: {
    "@id": "http://xmlns.com/foaf/0.1/img",
    "@type": "@id",
  },
  depiction: {
    "@id": "http://xmlns.com/foaf/0.1/depiction",
    "@type": "@id",
  },
  hasPhoto: {
    "@id": "http://www.w3.org/2006/vcard/ns#hasPhoto",
    "@type": "@id",
  },
  hasAddress: {
    "@id": "http://www.w3.org/2006/vcard/ns#hasAddress",
    "@type": "@id",
  },
  "street-address": {
    "@id": "http://www.w3.org/2006/vcard/ns#street-address",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  locality: {
    "@id": "http://www.w3.org/2006/vcard/ns#locality",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  region: {
    "@id": "http://www.w3.org/2006/vcard/ns#region",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  "postal-code": {
    "@id": "http://www.w3.org/2006/vcard/ns#postal-code",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  "country-name": {
    "@id": "http://www.w3.org/2006/vcard/ns#country-name",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  hasGeo: {
    "@id": "http://www.w3.org/2006/vcard/ns#hasGeo",
    "@type": "@id",
  },
  latitude: {
    "@id": "http://www.w3.org/2006/vcard/ns#latitude",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
  longitude: {
    "@id": "http://www.w3.org/2006/vcard/ns#longitude",
    "@type": "http://www.w3.org/2001/XMLSchema#string",
  },
};
