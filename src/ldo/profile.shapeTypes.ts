import { ShapeType } from "@ldo/ldo";
import { profileSchema } from "./profile.schema";
import { profileContext } from "./profile.context";
import { WebIdProfile, Address, Geo } from "./profile.typings";

/**
 * =============================================================================
 * LDO ShapeTypes profile
 * =============================================================================
 */

/**
 * WebIdProfile ShapeType
 */
export const WebIdProfileShapeType: ShapeType<WebIdProfile> = {
  schema: profileSchema,
  shape:
    "https://id.volunteeringdata.io/volunteer-profile/shapes/WebIdProfileShape",
  context: profileContext,
};

/**
 * Address ShapeType
 */
export const AddressShapeType: ShapeType<Address> = {
  schema: profileSchema,
  shape:
    "https://id.volunteeringdata.io/volunteer-profile/shapes/AddressShape",
  context: profileContext,
};

/**
 * Geo ShapeType
 */
export const GeoShapeType: ShapeType<Geo> = {
  schema: profileSchema,
  shape: "https://id.volunteeringdata.io/volunteer-profile/shapes/GeoShape",
  context: profileContext,
};
