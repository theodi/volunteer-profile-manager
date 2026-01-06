"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSolidAuth, useLdo, useSubject, useResource } from "@ldo/solid-react";
import { useRouter } from "next/navigation";
import { getPodUrlAll } from "@inrupt/solid-client";
import { VolunteerProfileShapeType } from "@/ldo/volunteer.shapeTypes";
import { WebIdProfileShapeType } from "@/ldo/profile.shapeTypes";
import type { VolunteerProfile, PreferredLocation, PreferredTime, Point } from "@/ldo/volunteer.typings";
import LocationEditor from "./editor/LocationEditor";
import TimeEditor from "./editor/TimeEditor";
import SkillsEditor from "./editor/SkillsEditor";
import CausesEditor from "./editor/CausesEditor";

// Available skills from SHACL shapes
export const SKILLS = [
  { id: "EmpathyAndCompassion", label: "Empathy and Compassion" },
  { id: "CalmnessUnderPressure", label: "Calmness Under Pressure" },
  { id: "PatienceAndUnderstanding", label: "Patience and Understanding" },
  { id: "ReliabilityAndTrustworthiness", label: "Reliability and Trustworthiness" },
  { id: "RespectForProfessionalBoundaries", label: "Respect for Professional Boundaries" },
  { id: "CulturalSensitivity", label: "Cultural Sensitivity" },
  { id: "TraumaInformedAwareness", label: "Trauma-Informed Awareness" },
  { id: "ConflictDeescalation", label: "Conflict De-escalation" },
  { id: "ClearSpokenCommunication", label: "Clear Spoken Communication" },
  { id: "ActiveListening", label: "Active Listening" },
  { id: "AbilityToRelayAccurateInformation", label: "Ability to Relay Accurate Information" },
  { id: "SupportingPeopleViaPhoneOnline", label: "Supporting People via Phone/Online" },
  { id: "UseOfRadiosAndWalkieTalkies", label: "Use of Radios and Walkie-Talkies" },
  { id: "ConfidenceEngagingWithPublicOrGroups", label: "Confidence Engaging with Public or Groups" },
  { id: "AbilityToWorkCooperatively", label: "Ability to Work Cooperatively" },
  { id: "AbilityToWorkIndependently", label: "Ability to Work Independently" },
  { id: "LeadingSmallGroupsOrTasks", label: "Leading Small Groups or Tasks" },
  { id: "ManagingConflictWithinTeams", label: "Managing Conflict within Teams" },
  { id: "SupportingOrMentoringNewVolunteers", label: "Supporting or Mentoring New Volunteers" },
  { id: "UnderstandingEmergencyBriefingsAndInstructions", label: "Understanding Emergency Briefings and Instructions" },
  { id: "BasicSafeguardingKnowledge", label: "Basic Safeguarding Knowledge" },
  { id: "RiskAwareness", label: "Risk Awareness" },
  { id: "SafeManualHandling", label: "Safe Manual Handling" },
  { id: "IncidentReporting", label: "Incident Reporting" },
  { id: "BasicFirstAidKnowledge", label: "Basic First Aid Knowledge" },
  { id: "FireSafetyAwareness", label: "Fire Safety Awareness" },
  { id: "WaterSafetyAwareness", label: "Water Safety Awareness" },
  { id: "Logistics", label: "Logistics" },
  { id: "ShelterSupport", label: "Shelter Support" },
  { id: "BasicRecordKeeping", label: "Basic Record Keeping" },
  { id: "UseOfBasicEquipment", label: "Use of Basic Equipment" },
  { id: "NavigationAndOrientation", label: "Navigation and Orientation" },
  { id: "Driving", label: "Driving" },
  { id: "CrowdQueueManagement", label: "Crowd/Queue Management" },
  { id: "PilotLicense", label: "Pilot License" },
  { id: "HGVCategoryD", label: "HGV Category D" },
  { id: "BasicITSkills", label: "Basic IT Skills" },
  { id: "ConfidentSmartphoneUse", label: "Confident Smartphone Use" },
  { id: "FamiliarityWithRemoteCommunicationTools", label: "Familiarity with Remote Communication Tools" },
  { id: "SimpleDataEntryAndReporting", label: "Simple Data Entry and Reporting" },
  { id: "ResponsibleHandlingOfSocialMedia", label: "Responsible Handling of Social Media" },
  { id: "KnowledgeOfLocalRoadsFacilitiesResources", label: "Knowledge of Local Roads, Facilities, Resources" },
  { id: "UnderstandingDiverseNeedsWithinCommunity", label: "Understanding Diverse Needs within Community" },
  { id: "AwarenessOfLocalSupportServices", label: "Awareness of Local Support Services" },
];

// Available requirements from SHACL shapes
export const REQUIREMENTS = [
  { id: "PhysicalStamina", label: "Physical Stamina" },
  { id: "AbilityToWorkOutdoors", label: "Ability to Work Outdoors" },
  { id: "PersonalPreparedness", label: "Personal Preparedness" },
  { id: "SturdyFootwear", label: "Sturdy Footwear" },
  { id: "WaterproofsAndWarmLayers", label: "Waterproofs and Warm Layers" },
  { id: "Gloves", label: "Gloves" },
  { id: "HighVisibilityVest", label: "High Visibility Vest" },
  { id: "HeadtorchOrFlashlight", label: "Headtorch or Flashlight" },
  { id: "PhoneAndPowerBank", label: "Phone and Power Bank" },
  { id: "SmallPersonalFirstAidKit", label: "Small Personal First Aid Kit" },
  { id: "WaterBottle", label: "Water Bottle" },
  { id: "FourByFourVehicle", label: "4x4 Vehicle" },
  { id: "SUVOrOffRoadVehicle", label: "SUV or Off-Road Vehicle" },
  { id: "VehicleWithTowCapability", label: "Vehicle with Tow Capability" },
  { id: "AccessToVanOrPeopleCarrier", label: "Access to Van or People Carrier" },
  { id: "AbilityToTransportEquipmentOrSupplies", label: "Ability to Transport Equipment or Supplies" },
  { id: "AccessToBicyclesOrCargoBikes", label: "Access to Bicycles or Cargo Bikes" },
  { id: "Boat", label: "Boat" },
  { id: "Hovercraft", label: "Hovercraft" },
  { id: "WalkieTalkiesOrRadios", label: "Walkie-Talkies or Radios" },
  { id: "PortableGeneratorOrPowerStation", label: "Portable Generator or Power Station" },
  { id: "WaterPump", label: "Water Pump" },
  { id: "Tools", label: "Tools" },
  { id: "PortableShelterOrGazebo", label: "Portable Shelter or Gazebo" },
  { id: "ThermalBlankets", label: "Thermal Blankets" },
  { id: "PPE", label: "PPE" },
  { id: "MapsOrWaterproofMapCases", label: "Maps or Waterproof Map Cases" },
  { id: "LifeJacket", label: "Life Jacket" },
  { id: "Venue", label: "Venue" },
  { id: "Kitchen", label: "Kitchen" },
];

// Available causes from SHACL shapes
export const CAUSES = [
  { id: "MentalHealth", label: "Mental Health", category: "Health" },
  { id: "PhysicalHealth", label: "Physical Health", category: "Health" },
  { id: "DisabilitySupport", label: "Disability Support", category: "Health" },
  { id: "ElderCare", label: "Elder Care", category: "Health" },
  { id: "Education", label: "Education", category: "Education" },
  { id: "YouthDevelopment", label: "Youth Development", category: "Education" },
  { id: "Mentoring", label: "Mentoring", category: "Education" },
  { id: "Literacy", label: "Literacy", category: "Education" },
  { id: "EnvironmentalConservation", label: "Environmental Conservation", category: "Environment" },
  { id: "ClimateAction", label: "Climate Action", category: "Environment" },
  { id: "WildlifeProtection", label: "Wildlife Protection", category: "Environment" },
  { id: "SustainableLiving", label: "Sustainable Living", category: "Environment" },
  { id: "Homelessness", label: "Homelessness", category: "Community" },
  { id: "FoodSecurity", label: "Food Security", category: "Community" },
  { id: "CommunityDevelopment", label: "Community Development", category: "Community" },
  { id: "SocialInclusion", label: "Social Inclusion", category: "Community" },
  { id: "RefugeeSupport", label: "Refugee Support", category: "Community" },
  { id: "ArtsAndCulture", label: "Arts and Culture", category: "Arts" },
  { id: "HeritagePreservation", label: "Heritage Preservation", category: "Arts" },
  { id: "Sports", label: "Sports", category: "Arts" },
  { id: "DisasterRelief", label: "Disaster Relief", category: "Emergency" },
  { id: "EmergencyResponse", label: "Emergency Response", category: "Emergency" },
  { id: "AnimalWelfare", label: "Animal Welfare", category: "Animal Welfare" },
  { id: "AnimalRescue", label: "Animal Rescue", category: "Animal Welfare" },
  { id: "InternationalDevelopment", label: "International Development", category: "International" },
  { id: "HumanRights", label: "Human Rights", category: "International" },
];

// Days of week from W3C Time Ontology (using full URIs as stored in RDF)
export const DAYS_OF_WEEK = [
  { id: "http://www.w3.org/2006/time#Monday", label: "Monday" },
  { id: "http://www.w3.org/2006/time#Tuesday", label: "Tuesday" },
  { id: "http://www.w3.org/2006/time#Wednesday", label: "Wednesday" },
  { id: "http://www.w3.org/2006/time#Thursday", label: "Thursday" },
  { id: "http://www.w3.org/2006/time#Friday", label: "Friday" },
  { id: "http://www.w3.org/2006/time#Saturday", label: "Saturday" },
  { id: "http://www.w3.org/2006/time#Sunday", label: "Sunday" },
];

// Times of day (using full URIs as stored in RDF)
export const TIMES_OF_DAY = [
  { id: "https://id.volunteeringdata.io/volunteer-profile/Morning", label: "Morning" },
  { id: "https://id.volunteeringdata.io/volunteer-profile/Afternoon", label: "Afternoon" },
  { id: "https://id.volunteeringdata.io/volunteer-profile/Evening", label: "Evening" },
];

export default function ProfileEditor() {
  const { session, logout, fetch: solidFetch } = useSolidAuth();
  const { createData, commitData } = useLdo();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"location" | "time" | "skills" | "causes">("location");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [profileUri, setProfileUri] = useState<string | undefined>(undefined);

  // Discover storage from WebID and construct profile URI
  useEffect(() => {
    async function discoverStorage() {
      if (!session.webId || !solidFetch) {
        setProfileUri(undefined);
        return;
      }

      try {
        // Discover all storage locations linked from the WebID
        const podUrls = await getPodUrlAll(session.webId, { fetch: solidFetch });
        
        if (podUrls.length > 0) {
          // Use the first storage location and append 'volunteer/profile'
          const firstPodUrl = podUrls[0];
          // Ensure the pod URL ends with a slash for proper URL construction
          const normalizedPodUrl = firstPodUrl.endsWith('/') ? firstPodUrl : `${firstPodUrl}/`;
          const volunteerProfileUri = new URL("volunteer/profile", normalizedPodUrl).href;
          setProfileUri(volunteerProfileUri);
        } else {
          console.error("No storage found for WebID:", session.webId);
          setSaveMessage({
            type: "error",
            text: "No storage found for your WebID. Please check your profile configuration.",
          });
        }
      } catch (error) {
        console.error("Error discovering storage:", error);
        setSaveMessage({
          type: "error",
          text: "Failed to discover storage location. Please try again.",
        });
      }
    }

    discoverStorage();
  }, [session.webId, solidFetch, setProfileUri, setSaveMessage]);

  // Load the volunteer profile resource
  const profileResource = useResource(profileUri);
  const profile = useSubject(VolunteerProfileShapeType, profileUri);

  // Load the WebID profile using LDO
  const webIdResource = useResource(session.webId?.split('#')[0]);
  const webIdProfile = useSubject(WebIdProfileShapeType, session.webId);

  // Derive user profile info from WebID card
  const userProfileName = webIdProfile?.fn || webIdProfile?.name || webIdProfile?.givenName;
  // Check multiple image predicates (img, hasPhoto, depiction)
  const webIdProfileAny = webIdProfile as Record<string, unknown> | undefined;
  const userProfileImage = 
    webIdProfile?.img?.["@id"] || 
    (webIdProfileAny?.hasPhoto as { "@id": string } | undefined)?.["@id"] ||
    (webIdProfileAny?.depiction as { "@id": string } | undefined)?.["@id"];

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Local state for editing
  const [locations, setLocations] = useState<PreferredLocation[]>([]);
  const [times, setTimes] = useState<PreferredTime[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [causes, setCauses] = useState<string[]>([]);

  // Determine if the profile is still loading
  const isProfileLoading = !profileResource || 
    (profileResource.status.type !== "dataReadSuccess" && 
     profileResource.status.type !== "containerReadSuccess" &&
     profileResource.status.type !== "absentReadSuccess");

  // Initialize local state from profile when loaded
  useEffect(() => {
    const isReady = profileResource?.status.type === "dataReadSuccess" || 
                   profileResource?.status.type === "containerReadSuccess";
    if (profile && isReady) {
      // Extract locations
      if (profile.preferredLocation) {
        const locs = Array.from(profile.preferredLocation).map((loc) => ({
          point: loc.point,
          rad: loc.rad,
        }));
        setLocations(locs as PreferredLocation[]);
      }

      // Extract times - explicitly extract @id values to ensure plain objects work correctly
      if (profile.preferredTime) {
        const tms = Array.from(profile.preferredTime)
          .map((t) => {
            const dayId = t.day?.["@id"];
            const timeId = t.time?.["@id"];
            // Only include entries with both day and time @id values
            if (dayId && timeId) {
              return {
                day: { "@id": dayId },
                time: { "@id": timeId },
              };
            }
            return null;
          })
          .filter((t): t is PreferredTime => t !== null);
        setTimes(tms);
      }

      // Extract skills
      if (profile.hasSkill) {
        const skillIds = Array.from(profile.hasSkill).map((s) => s["@id"]).filter(Boolean) as string[];
        setSkills(skillIds);
      }

      // Extract requirements
      if (profile.hasRequirement) {
        const reqIds = Array.from(profile.hasRequirement).map((r) => r["@id"]).filter(Boolean) as string[];
        setRequirements(reqIds);
      }

      // Extract causes
      if (profile.preferredCause) {
        const causeIds = Array.from(profile.preferredCause).map((c) => c["@id"]).filter(Boolean) as string[];
        setCauses(causeIds);
      }
    }
  }, [profile, profileResource?.status]);

  const handleSave = useCallback(async () => {
    if (!profileUri || !session.webId || !profileResource) return;

    // Type guard for valid resource
    if (profileResource.status.type !== "dataReadSuccess" && 
        profileResource.status.type !== "containerReadSuccess" &&
        profileResource.status.type !== "absentReadSuccess") {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Create or update the profile
      const updatedProfile = createData(
        VolunteerProfileShapeType,
        profileUri,
        profileResource as any
      );

      // Clear existing data
      updatedProfile.preferredLocation?.clear();
      updatedProfile.preferredTime?.clear();
      updatedProfile.hasSkill?.clear();
      updatedProfile.hasRequirement?.clear();
      updatedProfile.preferredCause?.clear();

      // Add locations
      locations.forEach((loc, index) => {
        const locationNode = {
          "@id": `${profileUri}#location-${index}`,
          point: {
            "@id": `${profileUri}#point-${index}`,
            lat: loc.point.lat,
            long: loc.point.long,
          },
          rad: loc.rad,
        };
        updatedProfile.preferredLocation?.add(locationNode as PreferredLocation);
      });

      // Add times
      times.forEach((t, index) => {
        const timeNode = {
          "@id": `${profileUri}#time-${index}`,
          day: t.day,
          time: t.time,
        };
        updatedProfile.preferredTime?.add(timeNode as PreferredTime);
      });

      // Add skills
      skills.forEach((skillId) => {
        updatedProfile.hasSkill?.add({ "@id": skillId } as any);
      });

      // Add requirements
      requirements.forEach((reqId) => {
        updatedProfile.hasRequirement?.add({ "@id": reqId } as any);
      });

      // Add causes
      causes.forEach((causeId) => {
        updatedProfile.preferredCause?.add({ "@id": causeId } as any);
      });

      // Commit to the pod
      const result = await commitData(updatedProfile);

      if (result.isError) {
        throw new Error(result.message || "Failed to save profile");
      }

      setSaveMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save profile",
      });
    } finally {
      setIsSaving(false);
    }
  }, [profileUri, session.webId, createData, commitData, profileResource, locations, times, skills, requirements, causes]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!session.isLoggedIn) {
    return null;
  }

  const tabs = [
    { id: "location" as const, label: "Location", icon: "📍" },
    { id: "time" as const, label: "Availability", icon: "🕐" },
    { id: "skills" as const, label: "Skills & Requirements", icon: "🛠️" },
    { id: "causes" as const, label: "Causes", icon: "❤️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-900">Volunteer Profile</h1>
          </div>
          
          {/* User profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {userProfileImage ? (
                <img
                  src={userProfileImage}
                  alt={userProfileName || "Profile"}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center border-2 border-gray-200">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </button>

            {/* Dropdown menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User info section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {userProfileImage ? (
                      <img
                        src={userProfileImage}
                        alt={userProfileName || "Profile"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {userProfileName && (
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userProfileName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 truncate">
                        {session.webId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign out button */}
                <div className="px-2 py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Status messages */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Loading state */}
        {profileResource && 
         profileResource.status.type !== "dataReadSuccess" && 
         profileResource.status.type !== "containerReadSuccess" && 
         profileResource.status.type !== "serverError" && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        )}

        {/* Tab navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <nav className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-purple-600 bg-purple-50 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === "location" && (
              <LocationEditor
                locations={locations}
                onChange={setLocations}
                isLoading={isProfileLoading}
              />
            )}
            {activeTab === "time" && (
              <TimeEditor
                times={times}
                onChange={setTimes}
              />
            )}
            {activeTab === "skills" && (
              <SkillsEditor
                skills={skills}
                requirements={requirements}
                onSkillsChange={setSkills}
                onRequirementsChange={setRequirements}
              />
            )}
            {activeTab === "causes" && (
              <CausesEditor
                causes={causes}
                onChange={setCauses}
              />
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
