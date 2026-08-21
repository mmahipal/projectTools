# Settings Persistence System

## Overview

This application uses a Redux-like store system to persist all user settings and configurations, ensuring they survive code merges and deployments. Settings are stored per-user and persist across server restarts.

## Architecture

### Server-Side Store (`server/store/index.js`)

The server-side store manages:
- **Salesforce Settings**: Encrypted credentials per user
- **User Settings**: General settings organized by category
- **App Configurations**: Key-value configurations per user
- **User Preferences**: UI preferences and filters
- **Users, Roles, Reset Tokens**: Other application data

### Client-Side Store (`client/src/store/index.js`)

The client-side store provides:
- React Context API for state management
- Automatic synchronization with server
- Local state caching
- Easy-to-use hooks for components

## Data Persistence

### Storage Location

Settings are persisted to:
- **Directory**: `.runtime-data/` (outside codebase)
- **Location**: `process.env.DATA_DIR` or `{project-root}/.runtime-data/`
- **Files**:
  - `data/user-settings.json` - General user settings
  - `data/app-configurations.json` - App configurations
  - `salesforce-settings/salesforce-settings-{userId}.json` - Salesforce credentials (encrypted)
  - `data/user-preferences.json` - User preferences

### Why Settings Persist Across Code Merges

1. **`.runtime-data/` is in `.gitignore`** - Never committed to git
2. **Outside codebase** - Not affected by code merges
3. **Per-user files** - Each user has their own settings file
4. **Immediate persistence** - Critical settings are persisted immediately
5. **Automatic loading** - Settings are loaded on server startup

## Usage

### Server-Side

```javascript
const { userSettingsActions, appConfigurationActions } = require('./store/actions');

// Save settings for a category
userSettingsActions.setSetting(userId, 'notifications', {
  email: true,
  push: false
});

// Get settings for a category
const notifications = userSettingsActions.getSetting(userId, 'notifications');

// Save configuration
appConfigurationActions.setConfiguration(userId, 'theme', 'dark');

// Get configuration
const theme = appConfigurationActions.getConfiguration(userId, 'theme');
```

### Client-Side

```javascript
import { useSettings } from '../store';

function MyComponent() {
  const { 
    getSetting, 
    saveSetting, 
    getConfiguration, 
    saveConfiguration 
  } = useSettings();

  // Get setting
  const notifications = getSetting('notifications');

  // Save setting
  const handleSave = async () => {
    const result = await saveSetting('notifications', {
      email: true,
      push: false
    });
    if (result.success) {
      console.log('Settings saved!');
    }
  };

  // Get configuration
  const theme = getConfiguration('theme');

  // Save configuration
  const handleThemeChange = async (newTheme) => {
    await saveConfiguration('theme', newTheme);
  };
}
```

## API Endpoints

### User Settings

- `GET /api/user-settings` - Get all settings for authenticated user
- `GET /api/user-settings/:category` - Get settings for a category
- `POST /api/user-settings/:category` - Save settings for a category
- `DELETE /api/user-settings/:category` - Delete settings for a category

### App Configurations

- `GET /api/user-settings/config/:key` - Get a configuration value
- `POST /api/user-settings/config/:key` - Set a configuration value
- `DELETE /api/user-settings/config/:key` - Delete a configuration

## Salesforce Settings

Salesforce credentials are automatically saved to the store when configured via the Settings page. They are:
- Encrypted before storage
- Stored per-user
- Persisted immediately (no debounce)
- Loaded automatically on server startup

## Migration

If you have existing settings in the old location (`server/data/`), they will be automatically migrated to `.runtime-data/` on first access.

## Best Practices

1. **Use categories for settings** - Group related settings together
2. **Persist immediately for critical settings** - Use `store.persistImmediately()` for important data
3. **Handle errors gracefully** - Settings operations may fail, always check return values
4. **Don't store sensitive data in plain text** - Use encryption for credentials
5. **Use configurations for simple key-value pairs** - Use settings for complex objects

## Troubleshooting

### Settings Lost After Code Merge

If settings are lost:
1. Check that `.runtime-data/` exists and is not in git
2. Verify `DATA_DIR` environment variable is set correctly
3. Check file permissions on `.runtime-data/` directory
4. Review server logs for persistence errors

### Settings Not Loading

If settings don't load:
1. Check server logs for initialization errors
2. Verify user is authenticated
3. Check that store is initialized before use
4. Review file permissions

## Security

- All settings are user-specific (no cross-user access)
- Salesforce credentials are encrypted
- Settings require authentication
- Files are stored outside the codebase
- `.runtime-data/` is in `.gitignore`
