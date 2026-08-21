// Field definitions extracted from the project setup documents

module.exports = {
  projectInformation: {
    projectName: {
      label: 'Project Name',
      description: 'Include Workday ID, client alias, project name and project alias',
      example: 'P20315 Peregrine EN Transcription 2024 (Perkiomen-D)',
      type: 'text',
      required: true,
      section: 'Project Information'
    },
    shortProjectName: {
      label: 'Short Project Name',
      description: 'This should be the project alias only',
      example: 'Perkiomen-D',
      type: 'text',
      required: true,
      section: 'Project Information'
    },
    contributorProjectName: {
      label: 'Contributor Project Name',
      description: 'Same as Project Name',
      type: 'text',
      required: true,
      section: 'Project Information'
    },
    workdayProjectId: {
      label: 'Workday Project ID',
      description: 'Copy project ID from Workday',
      example: 'P20315',
      type: 'text',
      required: false, // Not required in ProjectSetup page
      section: 'Project Information'
    },
    appenPartner: {
      label: 'Appen Partner',
      description: 'Select Appen from the dropdown',
      type: 'select',
      options: ['Appen'],
      required: true,
      section: 'Project Information'
    },
    jobCategory: {
      label: 'Job Category',
      description: 'Usually --None-- or General Interest for LS',
      type: 'select',
      options: ['--None--', 'General Interest'],
      required: false,
      section: 'Project Information'
    },
    projectShortDescription: {
      label: 'Project Short Description',
      description: 'Write a brief project description which will appear on the contributors\' dashboard',
      example: 'Your task is to produce highly accurate transcriptions of speech combined with annotation mark-up. We will provide you with Guidelines for how to transcribe and annotate the audio.',
      type: 'textarea',
      required: false, // Not required in ProjectSetup page
      section: 'Project Information'
    },
    projectLongDescription: {
      label: 'Project Long Description',
      description: 'Provide a long description of the project, including requirements and qualifications. This is for internal purposes only and may contain confidential information.',
      type: 'textarea',
      required: false, // Not required in ProjectSetup page
      section: 'Project Information'
    },
    projectType: {
      label: 'Project Type',
      description: 'Select the category that fits your project',
      type: 'select',
      options: ['Transcription', 'Data Collection', 'Annotation', 'Quality Assurance', 'Other'],
      required: true,
      section: 'Project Information'
    },
    projectPriority: {
      label: 'Project Priority',
      description: 'Set to 50.0',
      type: 'number',
      default: 50.0,
      required: true,
      section: 'Project Information'
    }
  },
  projectDetails: {
    account: {
      label: 'Account',
      description: 'Select the client from a dropdown list. If the client does not currently exist in Mercury, contact Chris Way.',
      type: 'select',
      required: true,
      section: 'Project Details'
    },
    programName: {
      label: 'Program Name',
      description: 'Defaults to --None-- unless a specific program name is applicable',
      type: 'select',
      options: ['--None--'],
      required: false,
      section: 'Project Details'
    },
    hireStartDate: {
      label: 'Hire Start Date',
      description: 'Select the date when the project should become visible to the crowd',
      type: 'date',
      required: true,
      section: 'Project Details'
    },
    predictedCloseDate: {
      label: 'Predicted Close Date',
      description: 'Select the date when the project is scheduled to be completed',
      type: 'date',
      required: true,
      section: 'Project Details'
    },
    deliveryToolOrg: {
      label: 'Delivery Tool Org',
      description: 'Select either Appen or Client Tool. If both are used for the project, select either one.',
      type: 'radio',
      options: ['Appen', 'Client Tool'],
      required: false, // Not required in ProjectSetup page
      section: 'Project Details'
    },
    deliveryToolName: {
      label: 'Delivery Tool Name',
      description: 'Select the specific name of the Appen or client tool used to complete the project. If the tool is missing, select Other and inform the setup team via Teams channel.',
      type: 'select',
      required: false, // Not required in ProjectSetup page
      section: 'Project Details'
    },
    projectPage: {
      label: 'Project Page',
      description: 'Leave blank (previously used to link an AC page)',
      type: 'text',
      required: false,
      section: 'Project Details'
    },
    projectStatus: {
      label: 'Project Status',
      description: 'The initial status should be Draft, and the project should remain in Draft until all sections are completed',
      type: 'select',
      options: ['Draft', 'Open', 'Roster hold', 'Closed'],
      default: 'Draft',
      required: true,
      section: 'Project Details'
    }
  },
  paymentConfigurations: {
    projectPaymentMethod: {
      label: 'Project Payment Method',
      description: 'For self-reported projects: choose Self-Reported only. For productivity projects, such as transcription projects in ADAP: choose Productivity only.',
      type: 'radio',
      options: ['Self-Reported only', 'Productivity only'],
      required: true,
      section: 'Payment Configurations'
    },
    requirePMApprovalForProductivity: {
      label: 'Require PM Approval for Productivity',
      description: 'For self-reported projects: check this box. For productivity projects: uncheck this box.',
      type: 'checkbox',
      required: false,
      section: 'Payment Configurations',
      conditional: {
        dependsOn: 'projectPaymentMethod',
        logic: {
          'Self-Reported only': true,
          'Productivity only': false
        }
      }
    },
    paymentSetupRequired: {
      label: 'Payment Setup Required',
      description: 'This checkbox should be checked for all projects paid via Mercury/CrowdGen.',
      type: 'checkbox',
      required: false,
      section: 'Payment Configurations'
    }
  },
  requirements: {
    manualActivationRequired: {
      label: 'Manual Activation Required',
      description: 'This checkbox can be left blank for most LS projects. If checked, recruitment will manually check and activate each contributor before they can start working.',
      type: 'checkbox',
      required: false,
      section: 'Requirements for Contributor Active Status'
    },
    clientToolAccountRequired: {
      label: 'Client Tool Account Required',
      description: 'This checkbox is relevant if help is needed to grant contributors access to specific client tools like SRT or UHRS.',
      type: 'checkbox',
      required: false,
      section: 'Requirements for Contributor Active Status'
    }
  },
  people: {
    projectManager: {
      label: 'Project Manager',
      description: 'Select the project manager (PM)',
      type: 'select',
      required: true,
      section: 'People'
    },
    projectSupportLead: {
      label: 'Project Support Lead',
      description: 'Select the project linguist',
      type: 'select',
      required: false, // Not required in ProjectSetup page (only projectManager is required)
      section: 'People'
    },
    casesDCSupportTeam: {
      label: 'Cases DC Support Team',
      description: 'This field only applies to DC projects. It should only be used if a DC helpdesk team member is assigned to the project.',
      type: 'select',
      required: false,
      section: 'People'
    }
  },
  languages: {
    languages: {
      label: 'Languages',
      description: 'List of languages and locations for the project',
      type: 'dynamic-array',
      fields: [
        { name: 'language', label: 'Language', type: 'text', required: true },
        { name: 'location', label: 'Location', type: 'text', required: true },
        { name: 'priority', label: 'Priority', type: 'number', required: false }
      ],
      section: 'Languages'
    }
  },
  budget: {
    budgetItems: {
      label: 'Budget Items',
      description: 'Budget and resource allocation for crowd-sourced language tasks',
      type: 'dynamic-array',
      fields: [
        { name: 'role', label: 'Role/Language', type: 'text', required: true },
        { name: 'rate', label: '$ per hour or per unit (USD)', type: 'number', required: true },
        { name: 'xrtASRAssisted', label: 'XRT ASR Assisted', type: 'number', required: false },
        { name: 'teamSize', label: 'Team Size Needed', type: 'text', required: false },
        { name: 'totalHours', label: 'Total hours or units', type: 'number', required: false },
        { name: 'totalAmount', label: 'TOTAL $ (USD)', type: 'number', required: false }
      ],
      section: 'Budget'
    }
  },
  links: {
    sowURL: {
      label: 'SOW (Statement of Work) URL',
      description: 'Link to Statement of Work',
      type: 'url',
      required: false,
      section: 'Links & Locations'
    },
    jiraTicketURL: {
      label: 'Jira SQ Ticket URL',
      description: 'Link to Jira ticket',
      type: 'url',
      required: false,
      section: 'Links & Locations'
    },
    casablancaHomeURL: {
      label: 'Casablanca Home URL',
      description: 'Link to Casablanca project page',
      type: 'url',
      required: false,
      section: 'Links & Locations'
    },
    qualityProjectURLs: {
      label: 'Quality Project URLs',
      description: 'URLs for quality projects by language',
      type: 'dynamic-array',
      fields: [
        { name: 'language', label: 'Language', type: 'text', required: true },
        { name: 'url', label: 'URL', type: 'url', required: true }
      ],
      section: 'Links & Locations'
    },
    recruitmentTicketURLs: {
      label: 'Recruitment Ticket URLs',
      description: 'Jira recruitment ticket URLs by language',
      type: 'dynamic-array',
      fields: [
        { name: 'language', label: 'Language', type: 'text', required: true },
        { name: 'url', label: 'URL', type: 'url', required: true }
      ],
      section: 'Links & Locations'
    },
    projectServerLocation: {
      label: 'Projects Server Location',
      description: 'Path to project files on server',
      type: 'text',
      required: false,
      section: 'Links & Locations'
    },
    locationOfAudio: {
      label: 'Location of Audio',
      description: 'Description of where audio files are stored',
      type: 'textarea',
      required: false,
      section: 'Links & Locations'
    },
    locationOfDeliverables: {
      label: 'Location of Deliverables',
      description: 'Path to deliverables folder',
      type: 'text',
      required: false,
      section: 'Links & Locations'
    }
  },
  timeline: {
    dataHoursPerLanguage: {
      label: 'Data Hours Per Language',
      description: 'Number of hours of data per language',
      type: 'number',
      default: 30,
      required: false,
      section: 'Timeline'
    },
    setupProductionWeeks: {
      label: 'Setup & Production Weeks',
      description: 'Number of weeks for setup and production',
      type: 'number',
      default: 4,
      required: false,
      section: 'Timeline'
    },
    milestones: {
      label: 'Milestones',
      description: 'Project milestones and dates',
      type: 'dynamic-array',
      fields: [
        { name: 'week', label: 'Week', type: 'text', required: true },
        { name: 'action', label: 'Action', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'Completed'], required: false },
        { name: 'date', label: 'Date', type: 'date', required: false }
      ],
      section: 'Timeline'
    }
  },
  projectTeam: {
    teamMembers: {
      label: 'Team Members',
      description: 'Project team members and their roles',
      type: 'dynamic-array',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'role', label: 'Role in Project', type: 'text', required: true },
        { name: 'location', label: 'Location/Working Hours', type: 'text', required: false }
      ],
      section: 'Project Team'
    }
  },
  communication: {
    communicationItems: {
      label: 'Communication & Reporting',
      description: 'Project communication and reporting schedule',
      type: 'dynamic-array',
      fields: [
        { name: 'who', label: 'Who', type: 'text', required: true },
        { name: 'what', label: 'What', type: 'text', required: true },
        { name: 'when', label: 'When', type: 'text', required: true }
      ],
      section: 'Project Communication and Reporting'
    }
  },
  projectObjective: {
    contributorFacingProjectName: {
      label: 'Contributor Facing Project Name',
      description: 'The name of the project as it appears to contributors',
      type: 'text',
      required: true,
      section: 'Project Objective'
    },
    projectObjectiveName: {
      label: 'Project Objective Name',
      description: 'The name of the project objective',
      type: 'text',
      required: true,
      section: 'Project Objective'
    },
    project: {
      label: 'Project',
      description: 'The project this objective belongs to',
      type: 'text',
      required: true,
      section: 'Project Objective'
    },
    workType: {
      label: 'Work Type',
      description: 'Type of work arrangement',
      type: 'select',
      options: ['Independent Contractor - Project Based', 'Independent Contractor - Ongoing', 'Employee'],
      required: true,
      section: 'Project Objective'
    },
    daysBetweenReminderEmails: {
      label: 'Days Between Reminder Emails',
      description: 'Number of days between reminder emails',
      type: 'number',
      required: true,
      section: 'Project Objective'
    },
    country: {
      label: 'Country',
      description: 'Country for the project objective',
      type: 'select',
      required: false,
      section: 'Project Objective'
    },
    language: {
      label: 'Language',
      description: 'Language for the project objective',
      type: 'select',
      required: false,
      section: 'Project Objective'
    },
    dateStart: {
      label: 'Date Start',
      description: 'Start date for the project objective',
      type: 'date',
      required: false,
      section: 'Project Objective'
    },
    dateEnd: {
      label: 'Date End',
      description: 'End date for the project objective',
      type: 'date',
      required: false,
      section: 'Project Objective'
    },
    selectionCriteria: {
      label: 'Selection Criteria',
      description: 'Criteria for selecting contributors',
      type: 'textarea',
      required: false,
      section: 'Project Objective'
    },
    projectObjectiveDescription: {
      label: 'Project Objective Description',
      description: 'Description of the project objective',
      type: 'text',
      required: false,
      section: 'Project Objective'
    },
    weeklyContributorProductionHours: {
      label: 'Weekly Contributor Production Hours',
      description: 'Weekly production hours per contributor',
      type: 'number',
      required: false,
      section: 'Project Objective'
    },
    dialect: {
      label: 'Dialect',
      description: 'Dialect for the project objective',
      type: 'select',
      required: false,
      section: 'Project Objective'
    },
    degreeRequirement: {
      label: 'Degree Requirement',
      description: 'Educational degree requirement',
      type: 'select',
      required: false,
      section: 'Project Objective'
    },
    languageSkillLevel: {
      label: 'Language Skill Level',
      description: 'Required language skill level',
      type: 'select',
      required: false,
      section: 'Project Objective'
    },
    fluencyType: {
      label: 'Fluency Type',
      description: 'Type of fluency required',
      type: 'select',
      required: false,
      section: 'Project Objective'
    }
  },
  qualificationStep: {
    qualificationStepProject: {
      label: 'Project',
      description: 'The project this qualification step belongs to',
      type: 'text',
      required: true,
      section: 'Qualification Step'
    },
    qualificationStepProjectObjective: {
      label: 'Project Objective',
      description: 'The project objective this qualification step belongs to',
      type: 'text',
      required: false, // Not required in ProjectQualificationStepSetup page
      section: 'Qualification Step'
    },
    qualificationStep: {
      label: 'Qualification Step',
      description: 'The name of the qualification step',
      type: 'text',
      required: true,
      section: 'Qualification Step'
    },
    funnel: {
      label: 'Funnel',
      description: 'Funnel designation (A, B, C, D, or E)',
      type: 'select',
      options: ['A', 'B', 'C', 'D', 'E'],
      required: true,
      section: 'Qualification Step'
    },
    stepNumber: {
      label: 'Step Number',
      description: 'The step number in the qualification process',
      type: 'number',
      required: true,
      section: 'Qualification Step'
    },
    numberOfAttempts: {
      label: 'Number of Attempts',
      description: 'Number of attempts allowed for this qualification step',
      type: 'number',
      required: true,
      section: 'Qualification Step'
    },
    stepDescription: {
      label: 'Step Description',
      description: 'Description of the qualification step',
      type: 'textarea',
      required: false,
      section: 'Qualification Step'
    },
    passingScore: {
      label: 'Passing Score',
      description: 'Minimum score required to pass this step',
      type: 'number',
      required: false,
      section: 'Qualification Step'
    },
    timeLimit: {
      label: 'Time Limit',
      description: 'Time limit for completing this step (in minutes)',
      type: 'number',
      required: false,
      section: 'Qualification Step'
    }
  },
  projectPage: {
    projectPageType: {
      label: 'Project Page Type',
      description: 'Type of project page',
      type: 'text',
      required: true,
      section: 'Project Page'
    },
    pageProject: {
      label: 'Project',
      description: 'The project this page belongs to',
      type: 'text',
      required: true,
      section: 'Project Page'
    },
    pageProjectObjective: {
      label: 'Project Objective',
      description: 'The project objective this page belongs to',
      type: 'text',
      required: true,
      section: 'Project Page'
    },
    pageQualificationStep: {
      label: 'Qualification Step',
      description: 'The qualification step this page belongs to (required only for Project Qualifying Page type)',
      type: 'text',
      required: false, // Conditionally required in ProjectPageSetup - only when pageType is "Project Qualifying Page"
      section: 'Project Page'
    },
    active: {
      label: 'Active',
      description: 'Whether the project page is active',
      type: 'checkbox',
      required: false,
      section: 'Project Page'
    },
    pageDescription: {
      label: 'Page Description',
      description: 'Description of the project page',
      type: 'textarea',
      required: false,
      section: 'Project Page'
    },
    pageURL: {
      label: 'Page URL',
      description: 'URL for the project page',
      type: 'url',
      required: false,
      section: 'Project Page'
    },
    pageOrder: {
      label: 'Page Order',
      description: 'Display order of the page',
      type: 'number',
      required: false,
      section: 'Project Page'
    }
  }
};





