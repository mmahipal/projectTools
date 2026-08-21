/**
 * Script to fix all admin users - ensure they have 'all' permissions
 * Run this script to update all existing admin users in the database
 */

const { userActions } = require('../store/actions');
const { ROLES } = require('../utils/roles');

const fixAdminUsers = async () => {
  console.log('🔧 Starting admin user fix script...');
  
  // Ensure store is initialized
  const store = require('../store');
  if (!store.isInitialized) {
    console.log('⏳ Store not initialized, initializing...');
    await store.initialize();
  }
  
  const users = userActions.getUsers();
  console.log(`Found ${users.length} users in database`);
  
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let changesMade = false;
  
  users.forEach(user => {
    const isAdminRole = user.role === ROLES.ADMIN || 
                        user.role?.toLowerCase() === 'admin' ||
                        user.role === 'Admin' ||
                        user.role === 'ADMIN';
    
    if (isAdminRole) {
      console.log(`\n📋 Checking admin user: ${user.email}`);
      console.log(`   Current role: ${user.role}`);
      console.log(`   Current permissions:`, user.permissions);
      
      // Ensure permissions is an array
      let userPermissions = user.permissions;
      if (!userPermissions || !Array.isArray(userPermissions)) {
        console.log(`   ⚠️  Permissions is not an array, fixing...`);
        userPermissions = [];
      }
      
      // Check if 'all' permission is missing
      if (!userPermissions.includes('all')) {
        console.log(`   ❌ Missing 'all' permission, fixing...`);
        user.permissions = ['all'];
        user.updatedAt = new Date().toISOString();
        user.updatedBy = 'system_admin_fix_script';
        userActions.updateUser(user);
        fixedCount++;
        changesMade = true;
        console.log(`   ✅ Fixed! New permissions:`, user.permissions);
      } else {
        console.log(`   ✅ Already has 'all' permission`);
        alreadyCorrectCount++;
      }
    }
  });
  
  // Persist changes if any were made
  if (changesMade) {
    console.log(`\n💾 Persisting changes to disk...`);
    await store.persistImmediately();
    console.log(`   ✅ Changes persisted`);
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount} admin users`);
  console.log(`   Already correct: ${alreadyCorrectCount} admin users`);
  console.log(`   Total admin users: ${fixedCount + alreadyCorrectCount}`);
  console.log(`\n✅ Admin user fix script completed!`);
  
  return { fixedCount, alreadyCorrectCount };
};

// Run if called directly
if (require.main === module) {
  const store = require('../store');
  
  // Initialize store first
  store.initialize().then(() => {
    fixAdminUsers();
    process.exit(0);
  }).catch(error => {
    console.error('Error initializing store:', error);
    process.exit(1);
  });
}

module.exports = { fixAdminUsers };
