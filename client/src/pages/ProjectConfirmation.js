// Line 145-162: Replace with proper console.log
      // Log the data being sent (for debugging)
      console.log('[ProjectConfirmation] Publishing project to Salesforce:', {
        totalFields: Object.keys(finalProjectData).length,
        fields: Object.keys(finalProjectData),
        sampleData: {
          projectName: finalProjectData.projectName,
          contributorProjectName: finalProjectData.contributorProjectName,
          projectType: finalProjectData.projectType,
          projectStatus: finalProjectData.projectStatus,
          projectManager: finalProjectData.projectManager,
          teamMembers: finalProjectData.teamMembers,
          teamMembersCount: finalProjectData.teamMembers ? finalProjectData.teamMembers.length : 0
        },
        projectManagerValue: finalProjectData.projectManager,
        teamMembersValue: finalProjectData.teamMembers,
        jsonData: JSON.stringify(finalProjectData, null, 2)
      });