import { ShapeType } from "@ldo/ldo";
import { volunteerSchema } from "./volunteer.schema";
import { volunteerContext } from "./volunteer.context";
import {
  VolunteerProfile,
  PreferredLocation,
  Point,
  PreferredTime,
} from "./volunteer.typings";

/**
 * =============================================================================
 * LDO ShapeTypes volunteer
 * =============================================================================
 */

/**
 * VolunteerProfile ShapeType
 */
export const VolunteerProfileShapeType: ShapeType<VolunteerProfile> = {
  schema: volunteerSchema,
  shape:
    "https://id.volunteeringdata.io/volunteer-profile/shapes/VolunteerProfileShape",
  context: volunteerContext,
};

/**
 * PreferredLocation ShapeType
 */
export const PreferredLocationShapeType: ShapeType<PreferredLocation> = {
  schema: volunteerSchema,
  shape:
    "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredLocationShape",
  context: volunteerContext,
};

/**
 * Point ShapeType
 */
export const PointShapeType: ShapeType<Point> = {
  schema: volunteerSchema,
  shape:
    "https://id.volunteeringdata.io/volunteer-profile/shapes/PointShape",
  context: volunteerContext,
};

/**
 * PreferredTime ShapeType
 */
export const PreferredTimeShapeType: ShapeType<PreferredTime> = {
  schema: volunteerSchema,
  shape:
    "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredTimeShape",
  context: volunteerContext,
};
