"use client";

import { useState, useCallback, useMemo } from "react";
import { SKILLS, REQUIREMENTS } from "../ProfileEditor";

interface SkillsEditorProps {
  skills: string[];
  requirements: string[];
  onSkillsChange: (skills: string[]) => void;
  onRequirementsChange: (requirements: string[]) => void;
}

// Group skills by category
const SKILL_CATEGORIES = {
  "Personal Qualities": [
    "EmpathyAndCompassion",
    "CalmnessUnderPressure",
    "PatienceAndUnderstanding",
    "ReliabilityAndTrustworthiness",
    "RespectForProfessionalBoundaries",
    "CulturalSensitivity",
    "TraumaInformedAwareness",
    "ConflictDeescalation",
  ],
  Communication: [
    "ClearSpokenCommunication",
    "ActiveListening",
    "AbilityToRelayAccurateInformation",
    "SupportingPeopleViaPhoneOnline",
    "UseOfRadiosAndWalkieTalkies",
    "ConfidenceEngagingWithPublicOrGroups",
  ],
  Teamwork: [
    "AbilityToWorkCooperatively",
    "AbilityToWorkIndependently",
    "LeadingSmallGroupsOrTasks",
    "ManagingConflictWithinTeams",
    "SupportingOrMentoringNewVolunteers",
    "UnderstandingEmergencyBriefingsAndInstructions",
  ],
  "Safety & Awareness": [
    "BasicSafeguardingKnowledge",
    "RiskAwareness",
    "SafeManualHandling",
    "IncidentReporting",
    "BasicFirstAidKnowledge",
    "FireSafetyAwareness",
    "WaterSafetyAwareness",
  ],
  "Practical Skills": [
    "Logistics",
    "ShelterSupport",
    "BasicRecordKeeping",
    "UseOfBasicEquipment",
    "NavigationAndOrientation",
    "Driving",
    "CrowdQueueManagement",
    "PilotLicense",
    "HGVCategoryD",
  ],
  Technology: [
    "BasicITSkills",
    "ConfidentSmartphoneUse",
    "FamiliarityWithRemoteCommunicationTools",
    "SimpleDataEntryAndReporting",
    "ResponsibleHandlingOfSocialMedia",
  ],
  "Local Knowledge": [
    "KnowledgeOfLocalRoadsFacilitiesResources",
    "UnderstandingDiverseNeedsWithinCommunity",
    "AwarenessOfLocalSupportServices",
  ],
};

const REQUIREMENT_CATEGORIES = {
  "Physical & Personal": [
    "PhysicalStamina",
    "AbilityToWorkOutdoors",
    "PersonalPreparedness",
  ],
  Clothing: [
    "SturdyFootwear",
    "WaterproofsAndWarmLayers",
    "Gloves",
    "HighVisibilityVest",
  ],
  Equipment: [
    "HeadtorchOrFlashlight",
    "PhoneAndPowerBank",
    "SmallPersonalFirstAidKit",
    "WaterBottle",
    "WalkieTalkiesOrRadios",
    "PortableGeneratorOrPowerStation",
    "WaterPump",
    "Tools",
    "PortableShelterOrGazebo",
    "ThermalBlankets",
    "PPE",
    "MapsOrWaterproofMapCases",
    "LifeJacket",
  ],
  Vehicles: [
    "FourByFourVehicle",
    "SUVOrOffRoadVehicle",
    "VehicleWithTowCapability",
    "AccessToVanOrPeopleCarrier",
    "AbilityToTransportEquipmentOrSupplies",
    "AccessToBicyclesOrCargoBikes",
    "Boat",
    "Hovercraft",
  ],
  Facilities: ["Venue", "Kitchen"],
};

export default function SkillsEditor({
  skills,
  requirements,
  onSkillsChange,
  onRequirementsChange,
}: SkillsEditorProps) {
  const [skillSearch, setSkillSearch] = useState("");
  const [reqSearch, setReqSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"skills" | "requirements">(
    "skills"
  );

  const toggleSkill = useCallback(
    (skillId: string) => {
      if (skills.includes(skillId)) {
        onSkillsChange(skills.filter((s) => s !== skillId));
      } else {
        onSkillsChange([...skills, skillId]);
      }
    },
    [skills, onSkillsChange]
  );

  const toggleRequirement = useCallback(
    (reqId: string) => {
      if (requirements.includes(reqId)) {
        onRequirementsChange(requirements.filter((r) => r !== reqId));
      } else {
        onRequirementsChange([...requirements, reqId]);
      }
    },
    [requirements, onRequirementsChange]
  );

  const filteredSkillsByCategory = useMemo(() => {
    const search = skillSearch.toLowerCase();
    const result: Record<string, typeof SKILLS> = {};

    Object.entries(SKILL_CATEGORIES).forEach(([category, skillIds]) => {
      const categorySkills = skillIds
        .map((id) => SKILLS.find((s) => s.id === id))
        .filter(
          (skill): skill is (typeof SKILLS)[0] =>
            skill !== undefined &&
            (search === "" || skill.label.toLowerCase().includes(search))
        );

      if (categorySkills.length > 0) {
        result[category] = categorySkills;
      }
    });

    return result;
  }, [skillSearch]);

  const filteredReqsByCategory = useMemo(() => {
    const search = reqSearch.toLowerCase();
    const result: Record<string, typeof REQUIREMENTS> = {};

    Object.entries(REQUIREMENT_CATEGORIES).forEach(([category, reqIds]) => {
      const categoryReqs = reqIds
        .map((id) => REQUIREMENTS.find((r) => r.id === id))
        .filter(
          (req): req is (typeof REQUIREMENTS)[0] =>
            req !== undefined &&
            (search === "" || req.label.toLowerCase().includes(search))
        );

      if (categoryReqs.length > 0) {
        result[category] = categoryReqs;
      }
    });

    return result;
  }, [reqSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Skills & Requirements
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Select your skills and the equipment/resources you can provide.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSection("skills")}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeSection === "skills"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Skills ({skills.length})
        </button>
        <button
          onClick={() => setActiveSection("requirements")}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeSection === "requirements"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Equipment & Resources ({requirements.length})
        </button>
      </div>

      {/* Skills section */}
      {activeSection === "skills" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Skills by category */}
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(filteredSkillsByCategory).map(
              ([category, categorySkills]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => {
                      const selected = skills.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            selected
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {skill.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Selected skills summary */}
          {skills.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-purple-800">
                  {skills.length} skill{skills.length !== 1 ? "s" : ""} selected
                </p>
                <button
                  onClick={() => onSkillsChange([])}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {skills.map((skillId) => {
                  const skill = SKILLS.find((s) => s.id === skillId);
                  return (
                    <span
                      key={skillId}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700"
                    >
                      {skill?.label || skillId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Requirements section */}
      {activeSection === "requirements" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={reqSearch}
              onChange={(e) => setReqSearch(e.target.value)}
              placeholder="Search equipment & resources..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Requirements by category */}
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(filteredReqsByCategory).map(
              ([category, categoryReqs]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryReqs.map((req) => {
                      const selected = requirements.includes(req.id);
                      return (
                        <button
                          key={req.id}
                          onClick={() => toggleRequirement(req.id)}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            selected
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {req.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Selected requirements summary */}
          {requirements.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-800">
                  {requirements.length} item{requirements.length !== 1 ? "s" : ""}{" "}
                  selected
                </p>
                <button
                  onClick={() => onRequirementsChange([])}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {requirements.map((reqId) => {
                  const req = REQUIREMENTS.find((r) => r.id === reqId);
                  return (
                    <span
                      key={reqId}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
                    >
                      {req?.label || reqId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
