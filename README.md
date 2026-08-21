# Project Tools - Salesforce Project Management Application

**Version 3.8.0**

A comprehensive web-based application designed to streamline the creation and management of Salesforce projects, project objectives, qualification steps, project pages, and project teams. The application provides a user-friendly interface for creating complex Salesforce records through guided workflows, with built-in validation, error handling, and direct integration with Salesforce APIs.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

## Overview

**Project Tools** is a full-stack web application that simplifies Salesforce project management by providing:

- **Guided Workflows**: Step-by-step wizards for creating complex Salesforce configurations
- **Multiple Input Methods**: Direct entry, file upload (JSON/CSV/Excel), or document parsing (PDF/DOCX/Images)
- **Real-Time Analytics**: Dashboard with comprehensive statistics and visualizations
- **Salesforce Integration**: Direct API integration with real-time sync status tracking
- **Role-Based Access Control**: Fine-grained permissions for different user roles
- **Audit Trail**: Complete history tracking of all operations

## Key Features

### 1. Quick Setup Wizard
- Single-page workflow for creating complete project configurations
- Creates Projects, Project Objectives, Qualification Steps, Project Pages, and Project Teams in one flow
- Real-time validation and error handling
- Draft saving and auto-recovery

### 2. Individual Object Creation
- **Create Project**: Comprehensive project setup with team management
- **Create Project Objective**: Detailed objective configuration
- **Create Qualification Step**: Step-by-step qualification setup
- **Create Project Page**: Page configuration and management
- **Create Project Team**: Team member assignment and role management

### 3. Content Management
- **View Saved Content**: Browse and manage all saved projects and objectives
- Filter by status (Draft, Open, Roster Hold, Closed)
- Filter by Salesforce sync status (Synced, Not Synced)
- Edit, delete, and resync capabilities
- JSON viewer for data inspection
- Bulk operations support

### 4. Dashboard & Analytics
- Real-time project statistics with auto-refresh
- Visual analytics (bar charts, line charts, pie charts, area charts)
- Projects by user analysis
- Projects by date trends
- Publishing activity metrics
- Top publishers tracking
- Quick action cards for common tasks

### 5. History & Audit Trail
- Complete history of all published items
- Filter by date range, object type, and publisher
- Track all Salesforce-synced items
- View publication timestamps and Salesforce IDs
- Centralized history logging system

### 6. Salesforce Integration
- Direct API integration with Salesforce
- Real-time sync status tracking
- Error handling and retry mechanisms
- Support for multiple Salesforce object types
- Secure credential management with encryption
- Bulk operations support

### 7. Advanced Management Features

#### Client Tool Account Management
- Create, update, and map Client Tool Accounts
- Searchable lookup with debouncing
- Bulk mapping to Contributor Projects
- Server-side pagination

#### Queue Status Management
- View and update Queue Status for Contributor Projects
- Individual and bulk updates
- Filter by Status and Queue Status
- Schedule rules and execution history

#### WorkStream Management
- Create single or multiple WorkStreams
- Collapsible/expandable forms
- Searchable Project Objective field
- Unified management interface

#### Update Object Fields
- Bulk field updates for Projects, Project Objectives, Contributor Projects
- Dynamic field selection from Salesforce
- Advanced filtering options
- Searchable filters with proper picklist handling

### 8. Analytics & Reporting Dashboards

#### Crowd Dashboard
- Demographic segmentation
- Contributor analytics
- Metrics and KPIs
- Visual data representations

#### Case Analytics Dashboard
- Case performance metrics
- Filtering and analysis tools
- Baseline data loading

#### Contributor Payments Dashboard
- Payment tracking and analytics
- Enhanced widgets with improved styling
- Comprehensive payment data

#### Project Performance Dashboard
- Project performance metrics
- Analytics and visualizations
- Performance tracking

### 9. Additional Features
- **Clone Projects**: Duplicate existing projects with modifications
- **Report Builder**: Create custom reports with advanced filtering
- **Scheduled Reports**: Automated report generation and delivery
- **User Management**: Complete user administration
- **Role & Permission Management**: Fine-grained access control
- **MFA Verification Logs**: Multi-factor authentication tracking
- **PM Approvals**: Project manager approval workflows
- **Payment Adjustments**: Manage contributor payment adjustments
- **Pay Rates Management**: Configure pay rates for project objectives
- **Productivity Targets**: Set and track productivity targets

### 10. Document Processing
- **File Upload**: Support for JSON, CSV, XLS, XLSX formats
- **Document Parsing**: PDF, DOCX, TXT file processing
- **OCR Capabilities**: Image text extraction using Tesseract.js
- **NLP Processing**: Natural language processing for data extraction
- **Auto-Population**: Forms automatically populated from parsed data

## Technology Stack

### Frontend
- **React** 18.2.0 - UI framework
- **React Router DOM** 6.20.0 - Routing
- **React Hook Form** 7.48.2 - Form management
- **Axios** 1.6.2 - HTTP client
- **Recharts** 3.4.1 - Data visualization
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **XLSX** 0.18.5 - Excel file parsing

### Backend
- **Node.js** - Runtime environment
- **Express.js** 4.18.2 - Web framework
- **jsforce** 3.10.8 - Salesforce API integration
- **JWT** (jsonwebtoken 9.0.2) - Authentication
- **bcryptjs** 2.4.3 - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **CSV Parser** - CSV file processing
- **PDF Parse** - PDF text extraction
- **Mammoth** - DOCX parsing
- **Tesseract.js** - OCR capabilities
- **Natural** - NLP processing
- **Express Rate Limit** - Rate limiting
- **Compression** - Response compression

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Step 1: Install Dependencies

Install all dependencies for both server and client:
```bash
npm run install-all
```

Or install separately:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Environment Setup

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `PORT`: Server port (default: 5000)
- `CLIENT_URL`: Frontend URL (default: http://localhost:3000)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `NODE_ENV`: Environment (development/production)

### Step 3: Create Upload Directory

The server will automatically create the `uploads/` directory, but you can create it manually:
```bash
mkdir -p server/uploads
```

### Step 4: Start the Application

#### Development Mode (Recommended)
Starts both server and client:
```bash
npm run dev
```

#### Separate Terminal Windows
Server only:
```bash
npm run server
```

Client only (in another terminal):
```bash
npm run client
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Usage

### Demo Credentials

- **Admin**: admin@example.com / admin123
  - Full access to all features
- **Project Manager**: pm@example.com / pm123
  - Can create, edit, and view projects
- **User**: user@example.com / user123
  - Can only view projects

### Application Flow

1. **Login**: Sign in with your credentials
2. **Welcome Page**: Overview of recent activity and quick actions
3. **Dashboard**: View analytics and statistics
4. **Create Content**: Use Quick Setup Wizard or individual creation pages
5. **Manage Content**: View, edit, delete, and sync projects
6. **Analytics**: Access various analytics dashboards
7. **Reports**: Create and schedule custom reports

### Input Methods

#### Direct Input
- Fill in forms manually through guided workflows
- Multi-section forms with progress tracking
- Real-time validation

#### File Upload
- **JSON**: Upload structured JSON files
- **CSV**: Upload comma-separated value files
- **Excel**: Upload XLS or XLSX files
- Automatic parsing and form population

#### Document Attachment
- **PDF**: Text extraction using pdf-parse
- **Word Documents** (.docx, .doc): Text extraction using mammoth
- **Text Files** (.txt): Direct text reading
- **Images** (.png, .jpg, .jpeg): OCR using Tesseract.js
- NLP-based data extraction

## Project Structure

```
project-tools/
├── server/                    # Backend application
│   ├── index.js              # Main server file
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── projects.js       # Project CRUD routes
│   │   ├── projectObjectives.js
│   │   ├── qualificationSteps.js
│   │   ├── salesforce/       # Salesforce integration routes
│   │   ├── upload.js         # File upload routes
│   │   ├── parse.js          # Document parsing routes
│   │   ├── drafts.js         # Draft management
│   │   ├── history.js        # History tracking
│   │   ├── clientToolAccount.js
│   │   ├── queueStatusManagement.js
│   │   ├── workStream.js
│   │   ├── updateObjectFields.js
│   │   ├── crowdDashboard.js
│   │   ├── caseAnalytics.js
│   │   ├── contributorPayments.js
│   │   └── ...               # Additional routes
│   ├── middleware/           # Express middleware
│   │   ├── auth.js           # Authentication middleware
│   │   ├── csrf.js           # CSRF protection
│   │   ├── inputSanitization.js
│   │   └── rbac.js           # Role-based access control
│   ├── services/            # Business logic services
│   │   ├── salesforce/      # Salesforce services
│   │   └── queueStatusScheduler.js
│   ├── utils/               # Utility functions
│   │   ├── auditLogger.js
│   │   ├── historyLogger.js
│   │   ├── cache.js
│   │   └── security.js
│   ├── config/              # Configuration files
│   │   ├── fieldDefinitions.js
│   │   └── featureFlags.js
│   ├── data/                # JSON data storage
│   └── uploads/             # File upload directory
├── client/                   # Frontend application
│   ├── public/              # Static files
│   └── src/
│       ├── App.js           # Main app component
│       ├── pages/           # Page components
│       │   ├── Dashboard.js
│       │   ├── ProjectSetup.js
│       │   ├── QuickSetupWizard.js
│       │   ├── ViewProjects.js
│       │   ├── History.js
│       │   └── ...          # Additional pages
│       ├── components/      # Reusable components
│       ├── context/         # React context providers
│       │   ├── AuthContext.js
│       │   ├── GPCFilterContext.js
│       │   └── SidebarContext.js
│       ├── hooks/           # Custom React hooks
│       ├── utils/           # Utility functions
│       ├── styles/         # CSS files
│       └── config/          # Configuration files
├── package.json             # Root package.json
├── README.md                # This file
├── INSTALLATION.md          # Detailed installation guide
├── APPLICATION_OVERVIEW.md  # Application overview
├── PROJECT_SUMMARY.md       # Project summary
├── CHANGELOG.md             # Change log
└── VERSION.md               # Version history
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Project Objectives
- `GET /api/project-objectives` - Get all project objectives
- `POST /api/project-objectives` - Create project objective
- `PUT /api/project-objectives/:id` - Update project objective
- `DELETE /api/project-objectives/:id` - Delete project objective

### Qualification Steps
- `GET /api/qualification-steps` - Get all qualification steps
- `POST /api/qualification-steps` - Create qualification step
- `PUT /api/qualification-steps/:id` - Update qualification step
- `DELETE /api/qualification-steps/:id` - Delete qualification step

### Salesforce Integration
- `POST /api/salesforce/create-project` - Create project in Salesforce
- `POST /api/salesforce/create-project-objective` - Create project objective in Salesforce
- `POST /api/salesforce/create-qualification-step` - Create qualification step in Salesforce
- `POST /api/salesforce/create-project-page` - Create project page in Salesforce
- `POST /api/salesforce/create-project-team` - Create project team in Salesforce
- `GET /api/salesforce/test-connection` - Test Salesforce connection
- `GET /api/salesforce/settings` - Get Salesforce settings

### File Upload & Parsing
- `POST /api/upload/json` - Upload and parse JSON file
- `POST /api/upload/csv` - Upload and parse CSV file
- `POST /api/parse/document` - Upload and parse document (PDF, DOCX, TXT, images)

### Drafts
- `GET /api/drafts` - Get all drafts
- `GET /api/drafts/:id` - Get draft by ID
- `POST /api/drafts` - Save draft
- `PUT /api/drafts/:id` - Update draft
- `DELETE /api/drafts/:id` - Delete draft

### History
- `GET /api/history` - Get operation history
- `GET /api/history/:id` - Get history entry by ID

### Additional Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/csrf-token` - Get CSRF token
- `GET /api/stats` - Get dashboard statistics
- And many more...

## Security Features

- **JWT Authentication**: Token-based authentication system
- **Role-Based Access Control (RBAC)**: Fine-grained permissions
- **CSRF Protection**: Cross-site request forgery protection
- **Input Sanitization**: Server-side input validation and sanitization
- **Helmet.js**: Security headers configuration
- **Rate Limiting**: API rate limiting (100 requests per 15 minutes)
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Configuration**: Secure cross-origin resource sharing
- **Session Management**: Secure session handling
- **Audit Logging**: Comprehensive audit trail
- **Encrypted Credentials**: Salesforce credentials stored encrypted

## Development

### Running in Development Mode
```bash
npm run dev
```
Starts both backend server (port 5000) and frontend (port 3000) concurrently.

### Running Server Only
```bash
npm run server
```
Starts only the backend server with nodemon for auto-reload.

### Running Client Only
```bash
npm run client
```
Starts only the React development server.

### Building for Production
```bash
npm run build
```
Builds the React frontend for production. The built files will be in `client/build/`.

### Restart Backend
```bash
npm run restart-backend
```
Restarts the backend server.

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:

1. Change the port in `.env`:
   ```
   PORT=5001
   ```

2. Or kill the process:
   ```bash
   # For macOS/Linux
   lsof -ti:5000 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   
   # For Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Module Not Found Errors
If you see module not found errors:
```bash
# Remove node_modules and reinstall
rm -rf node_modules client/node_modules
npm run install-all
```

### File Upload Issues
- Ensure `server/uploads/` directory exists and has write permissions
- Check file size limits (default: 50MB)
- Verify file format is supported

### OCR/Document Parsing Issues
- Tesseract.js requires time to initialize on first use
- Large images may take longer to process
- Ensure sufficient memory is available

### Salesforce Connection Issues
- Verify Salesforce credentials in Settings
- Check network connectivity
- Verify Salesforce API permissions
- Review error logs in browser console and server logs

### CORS Issues
- Verify `CLIENT_URL` in `.env` matches your frontend URL
- Check CORS configuration in `server/index.js`
- Ensure credentials are properly configured

## Documentation

Additional documentation is available:

- **INSTALLATION.md** - Detailed installation guide
- **APPLICATION_OVERVIEW.md** - Comprehensive application overview
- **PROJECT_SUMMARY.md** - Project summary and features
- **CHANGELOG.md** - Detailed change log
- **VERSION.md** - Version history
- **README_SERVER_MANAGEMENT.md** - Server management guide
- **TEAM_MEMBER_MAPPING.md** - Team member field mapping documentation
- **TEST_CHECKLIST.md** - Testing checklist

## Version History

- **Version 3.8.0** (Current) - Latest features and improvements
- **Version 3.7.0** - Enhanced features
- **Version 3.6.0** - Additional capabilities
- **Version 3.4.0** - Feature updates
- **Version 3.2.0** - Dashboard enhancements
- **Version 3.1.0** - UI/UX improvements
- **Version 3.0** - Major feature additions
- **Version 2.8.0** - Real-time analytics
- **Version 2.5.0** - Project team management
- **Version 2.0.0** - Project page setup
- **Version 1.0.0** - Initial release

See `VERSION.md` and `CHANGELOG.md` for detailed version history.

## License

ISC

## Contributing

This is a project management application. For contributions, please follow standard coding practices and ensure all tests pass.

---

**Note**: This application is designed to reduce manual Salesforce data entry, improve data consistency, and provide a centralized management interface for project-related Salesforce objects.
