# Project Team Member Mapping to Salesforce

## Overview
This document describes the field mapping used when publishing project team members to Salesforce.

## Input Data Structure (from Client)

The client sends the following data structure:
```javascript
{
  project: "Project Name" or "Project Salesforce ID",
  teamMembers: [
    {
      member: "Team Member Name",      // e.g., "Mahipal Reddy Moola"
      memberId: "User Salesforce ID",  // e.g., "005VC00000HvZKEYA3"
      role: "Team Member Role"          // e.g., "Tech Lead"
    }
  ]
}
```

## Salesforce Object Discovery

The system tries to find the Team Member object in Salesforce by checking these object names in order:
1. `Project_Team_Member__c`
2. `Team_Member__c`
3. `Team_Members__c`
4. `Project_Team__c`

The first object that exists in Salesforce is used.

## Field Mapping Logic

### 1. Project Field (Lookup to Project__c)

**Purpose**: Links the team member to a specific project.

**Field Discovery Process**:
1. Tries these field names in order:
   - `Project__c`
   - `Project_Id__c`
   - `Related_Project__c`
2. If none found, searches for any field that:
   - Contains "Project" in the name
   - Ends with `__c` (custom field)
   - Has type `reference` (lookup field)
3. Default fallback: `Project__c`

**Value Mapping**:
- If `project` is a Salesforce ID (15 or 18 characters), uses it directly
- If `project` is a name, queries Salesforce: `SELECT Id FROM Project__c WHERE Name = 'project name'`
- Maps to: `teamMemberData[projectField] = projectId`

**Example**:
```javascript
// Input: project = "ProjManPublish"
// After lookup: projectId = "a06VC00000B8PXZYA3"
// Field found: "Project__c"
// Result: teamMemberData.Project__c = "a06VC00000B8PXZYA3"
```

### 2. Member Field (Lookup to User or Contact)

**Purpose**: Links the team member to a specific User or Contact record.

**Field Discovery Process**:
1. Tries these field names in order:
   - `Team_Member__c`
   - `Member__c`
   - `User__c`
   - `Contact__c`
   - `Person__c`
2. If none found, searches for any field that:
   - Contains "Member" or "User" in the name
   - Ends with `__c` (custom field)
   - Has type `reference` (lookup field)
3. Default fallback: `Team_Member__c`

**Value Mapping**:
- Uses the `memberId` directly from input
- Maps to: `teamMemberData[memberField] = teamMember.memberId`

**Example**:
```javascript
// Input: memberId = "005VC00000HvZKEYA3"
// Field found: "Team_Member__c"
// Result: teamMemberData.Team_Member__c = "005VC00000HvZKEYA3"
```

### 3. Role Field (Picklist or Text)

**Purpose**: Stores the team member's role.

**Field Discovery Process**:
1. Tries these field names in order:
   - `Role__c`
   - `Member_Role__c`
   - `Team_Member_Role__c`
   - `Role`
2. If none found, searches for any field that:
   - Contains "Role" in the name
   - Ends with `__c` (custom field)
   - Has type `picklist`, `string`, or `text`
3. Default fallback: `Role__c`

**Value Mapping**:
- Uses the `role` directly from input
- Maps to: `teamMemberData[roleField] = teamMember.role`

**Example**:
```javascript
// Input: role = "Tech Lead"
// Field found: "Role__c"
// Result: teamMemberData.Role__c = "Tech Lead"
```

### 4. Name Field (Optional - Only if Writable)

**Purpose**: Sets a display name for the team member record.

**Field Discovery Process**:
- Checks if `Name` field exists in the object

**Value Mapping**:
- Only sets if field is `createable` OR `updateable`
- Value: `teamMember.member` OR `"${teamMember.role} - ${teamMember.memberId}"`
- Maps to: `teamMemberData.Name = teamMember.member || "${teamMember.role} - ${teamMember.memberId}"`

**Note**: This field is skipped if it's read-only or auto-generated (which is common in Salesforce).

**Example**:
```javascript
// Input: member = "Mahipal Reddy Moola", role = "Tech Lead"
// Field exists: true
// Field createable: false, updateable: false
// Result: Name field is SKIPPED (not added to teamMemberData)
```

## Complete Mapping Example

### Input:
```javascript
{
  project: "ProjManPublish",
  teamMembers: [
    {
      member: "Mahipal Reddy Moola",
      memberId: "005VC00000HvZKEYA3",
      role: "Tech Lead"
    }
  ]
}
```

### Processing Steps:

1. **Project Lookup**:
   ```sql
   SELECT Id FROM Project__c WHERE Name = 'ProjManPublish' LIMIT 1
   ```
   Result: `projectId = "a06VC00000B8PXZYA3"`

2. **Object Discovery**:
   - Tries: `Project_Team_Member__c` → Found ✓
   - Object used: `Project_Team_Member__c`

3. **Field Discovery**:
   - Project field: `Project__c` (found, type: reference)
   - Member field: `Team_Member__c` (found, type: reference)
   - Role field: `Role__c` (found, type: picklist)
   - Name field: `Name` (exists, but not writable) → Skipped

4. **Final Data Sent to Salesforce**:
   ```javascript
   {
     Project__c: "a06VC00000B8PXZYA3",
     Team_Member__c: "005VC00000HvZKEYA3",
     Role__c: "Tech Lead"
   }
   ```

5. **Salesforce API Call**:
   ```javascript
   conn.sobject('Project_Team_Member__c').create({
     Project__c: "a06VC00000B8PXZYA3",
     Team_Member__c: "005VC00000HvZKEYA3",
     Role__c: "Tech Lead"
   })
   ```

## Validation

Before creating the record, the system validates:
1. ✅ Project field exists in the object
2. ✅ Member field exists in the object
3. ✅ Role field exists in the object
4. ✅ At least one field is set (prevents empty record creation)

## Error Handling

If field mapping fails:
- The system logs which fields were found/not found
- Returns detailed error messages indicating which field is missing
- Continues processing other team members even if one fails

## Logging

The system logs:
- Which object was found and used
- Which fields were discovered for each type
- Whether each field exists in the object
- The final data structure being sent to Salesforce
- Success/failure for each team member creation

