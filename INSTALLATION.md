# Installation Guide

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Step-by-Step Installation

### 1. Navigate to Project Directory
```bash
cd ProjectSetup
```

### 2. Install Dependencies

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

### 3. Environment Setup

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `PORT`: Server port (default: 5000)
- `CLIENT_URL`: Frontend URL (default: http://localhost:3000)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `NODE_ENV`: Environment (development/production)

### 4. Create Upload Directory

The server will automatically create the `uploads/` directory, but you can create it manually:
```bash
mkdir -p server/uploads
```

### 5. Start the Application

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

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Testing the Application

### Login Credentials

Use these demo credentials to test the application:

1. **Admin** (Full Access)
   - Email: `admin@example.com`
   - Password: `admin123`

2. **Project Manager** (Create/Edit/View)
   - Email: `pm@example.com`
   - Password: `pm123`

3. **User** (View Only)
   - Email: `user@example.com`
   - Password: `user123`

### Test File Upload

Use the provided `sample-data.json` file to test file upload functionality:
1. Go to Project Setup
2. Select "Upload File"
3. Upload `sample-data.json`

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

Ensure the upload directory exists and has write permissions:
```bash
mkdir -p server/uploads
chmod 755 server/uploads
```

### OCR/Document Parsing Issues

- Tesseract.js requires time to initialize on first use
- Large images may take longer to process
- Ensure sufficient memory is available

## Production Deployment

### 1. Build the Client
```bash
cd client
npm run build
cd ..
```

### 2. Update Environment Variables
Update `.env` with production values:
- `NODE_ENV=production`
- `JWT_SECRET`: Use a strong, random secret
- `CLIENT_URL`: Your production frontend URL

### 3. Start the Server
```bash
npm start
```

The server will serve the built React app from the `client/build` directory.

## Next Steps

1. Review the README.md for detailed feature documentation
2. Test all input methods (Direct, File Upload, Document)
3. Explore the different sections of the project setup form
4. Review the confirmation page before submitting

## Support

For issues or questions, please refer to the main README.md file or contact the development team.
























