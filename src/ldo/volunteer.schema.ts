import { Schema } from "shexj";

/**
 * =============================================================================
 * volunteerSchema: ShexJ Schema for volunteer
 * =============================================================================
 */
export const volunteerSchema: Schema = {
  type: "Schema",
  shapes: [
    {
      id: "https://id.volunteeringdata.io/volunteer-profile/shapes/VolunteerProfileShape",
      type: "ShapeDecl",
      shapeExpr: {
        type: "Shape",
        extra: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"],
        expression: {
          id: "https://id.volunteeringdata.io/volunteer-profile/shapes/VolunteerProfileShapeExpr",
          type: "EachOf",
          expressions: [
            {
              type: "TripleConstraint",
              predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              valueExpr: {
                type: "NodeConstraint",
                values: [
                  "https://id.volunteeringdata.io/volunteer-profile/VolunteerProfile",
                ],
              },
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/preferredLocation",
              valueExpr:
                "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredLocationShape",
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/preferredTime",
              valueExpr:
                "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredTimeShape",
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/hasSkill",
              valueExpr: {
                type: "NodeConstraint",
                nodeKind: "iri",
              },
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/hasRequirement",
              valueExpr: {
                type: "NodeConstraint",
                nodeKind: "iri",
              },
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/preferredCause",
              valueExpr: {
                type: "NodeConstraint",
                nodeKind: "iri",
              },
              min: 0,
              max: -1,
            },
          ],
        },
      },
    },
    {
      id: "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredLocationShape",
      type: "ShapeDecl",
      shapeExpr: {
        type: "Shape",
        extra: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"],
        expression: {
          id: "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredLocationShapeExpr",
          type: "EachOf",
          expressions: [
            {
              type: "TripleConstraint",
              predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              valueExpr: {
                type: "NodeConstraint",
                values: [
                  "https://id.volunteeringdata.io/volunteer-profile/PreferredLocation",
                ],
              },
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/point",
              valueExpr:
                "https://id.volunteeringdata.io/volunteer-profile/shapes/PointShape",
              min: 1,
              max: 1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/rad",
              valueExpr: {
                type: "NodeConstraint",
                datatype: "http://www.w3.org/2001/XMLSchema#decimal",
                mininclusive: 0,
              },
              min: 1,
              max: 1,
            },
          ],
        },
      },
    },
    {
      id: "https://id.volunteeringdata.io/volunteer-profile/shapes/PointShape",
      type: "ShapeDecl",
      shapeExpr: {
        type: "Shape",
        extra: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"],
        expression: {
          id: "https://id.volunteeringdata.io/volunteer-profile/shapes/PointShapeExpr",
          type: "EachOf",
          expressions: [
            {
              type: "TripleConstraint",
              predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              valueExpr: {
                type: "NodeConstraint",
                values: [
                  "https://id.volunteeringdata.io/volunteer-profile/Point",
                ],
              },
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate: "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
              valueExpr: {
                type: "NodeConstraint",
                datatype: "http://www.w3.org/2001/XMLSchema#decimal",
                mininclusive: -90,
                maxinclusive: 90,
              },
              min: 1,
              max: 1,
            },
            {
              type: "TripleConstraint",
              predicate: "http://www.w3.org/2003/01/geo/wgs84_pos#long",
              valueExpr: {
                type: "NodeConstraint",
                datatype: "http://www.w3.org/2001/XMLSchema#decimal",
                mininclusive: -180,
                maxinclusive: 180,
              },
              min: 1,
              max: 1,
            },
          ],
        },
      },
    },
    {
      id: "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredTimeShape",
      type: "ShapeDecl",
      shapeExpr: {
        type: "Shape",
        extra: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"],
        expression: {
          id: "https://id.volunteeringdata.io/volunteer-profile/shapes/PreferredTimeShapeExpr",
          type: "EachOf",
          expressions: [
            {
              type: "TripleConstraint",
              predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              valueExpr: {
                type: "NodeConstraint",
                values: [
                  "https://id.volunteeringdata.io/volunteer-profile/PreferredTime",
                ],
              },
              min: 0,
              max: -1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/day",
              valueExpr: {
                type: "NodeConstraint",
                values: [
                  "http://www.w3.org/2006/time#Monday",
                  "http://www.w3.org/2006/time#Tuesday",
                  "http://www.w3.org/2006/time#Wednesday",
                  "http://www.w3.org/2006/time#Thursday",
                  "http://www.w3.org/2006/time#Friday",
                  "http://www.w3.org/2006/time#Saturday",
                  "http://www.w3.org/2006/time#Sunday",
                ],
              },
              min: 1,
              max: 1,
            },
            {
              type: "TripleConstraint",
              predicate:
                "https://id.volunteeringdata.io/volunteer-profile/time",
              valueExpr: {
                type: "NodeConstraint",
                values: [
                  "https://id.volunteeringdata.io/volunteer-profile/Morning",
                  "https://id.volunteeringdata.io/volunteer-profile/Afternoon",
                  "https://id.volunteeringdata.io/volunteer-profile/Evening",
                ],
              },
              min: 1,
              max: 1,
            },
          ],
        },
      },
    },
  ],
};
