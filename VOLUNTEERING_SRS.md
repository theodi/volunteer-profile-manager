Volunteer Profile
Problem Statement
Volunteers should be able to manage their profiles in one central location and use their profile data to find opportunities: create a volunteer profile stored in a pod, reuse the profile data as search parameters in a standard API.
Functional Requirements
A volunteer must be able to create a volunteer profile
Draft standard data model for volunteer profile
Solid application that allows volunteers to edit that profile
Shape to validate the volunteer profile data
A volunteer must be able to search opportunity data
Standard search API service
Hackathon infrastructure, and/or
VMS provider that has implemented draft standard open search
Search for opportunities that match their profile
Autopopulate search form
Fetch from standard API
Display opportunity data
Details

2 pages Solid application
Volunteering Profile Editor
Attributes defined by a SHACL constraint conformant to the standard data model for volunteer profile
Profile editor must edit an extended volunteer profile document (not the WebID) for volunteering preferences
Locations
Retrieve address info in extended profile to prepopulate location interest
Retrieve current location to prepopulate location
Standard profile information (e.g. address) can be read from the WebID and other extended profile documents. Only the volunteer profile document should be written to by this application.
Charitable Causes
Search UI and results
Results can either have details for expressing interest in activity (via email/phone…), or
Have an external apply link


