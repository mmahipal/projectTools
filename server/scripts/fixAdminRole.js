/**
 * Script to fix admin role - ensure it has 'all' permissions
 * Run this script to update the admin role in the database
 */

const { roleActions } = require('../store/actions');
const { ROLES, getAllIndividualPermissions } = require('../utils/roles');

const fixAdminRole = async () => {
  console.log('🔧 Starting admin role fix script...');
  
  // Ensure store is initialized
  const store = require('../store');
  if (!store.isInitialized) {
    console.log('⏳ Store not initialized, initializing...');
    await store.initialize();
  }
  
  const roles = roleActions.getRoles();
  console.log(`Found ${roles.length} roles in database`);
  
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let changesMade = false;
  
  roles.forEach(role => {
    const isAdminRole = role.name === ROLES.ADMIN || 
                        role.name?.toLowerCase() === 'admin' ||
                        role.name === 'Admin' ||
                        role.name === 'ADMIN';
    
    if (isAdminRole) {
      console.log(`\n📋 Checking admin role: ${role.name} (ID: ${role.id})`);
      console.log(`   Current permissions:`, role.permissions);
      
      // Ensure permissions is an array
      let rolePermissions = role.permissions;
      if (!rolePermissions || !Array.isArray(rolePermissions)) {
        console.log(`   ⚠️  Permissions is not an array, fixing...`);
        rolePermissions = [];
      }
      
      // Get all individual permissions that admin should have
      const allAdminPermissions = getAllIndividualPermissions();
      
      // Check if admin role has all individual permissions
      const hasAllPermissions = allAdminPermissions.every(perm => rolePermissions.includes(perm));
      const missingPermissions = allAdminPermissions.filter(perm => !rolePermissions.includes(perm));
      
      if (!hasAllPermissions || rolePermissions.length < allAdminPermissions.length) {
        console.log(`   ❌ Admin role missing permissions:`, missingPermissions);
        console.log(`   Fixing admin role to have all individual permissions...`);
        // Include 'all' for backward compatibility
        const { PERMISSIONS } = require('../utils/roles');
        role.permissions = [...allAdminPermissions, PERMISSIONS.ALL]; // Copy array and add 'all'
        role.updatedAt = new Date().toISOString();
        role.updatedBy = 'system_admin_role_fix_script';
        // Update the role in the array
        roles[roles.findIndex(r => r.id === role.id)] = role;
        fixedCount++;
        changesMade = true;
        console.log(`   ✅ Fixed! Admin role now has ${role.permissions.length} permissions (${allAdminPermissions.length} individual + 'all')`);
      } else {
        console.log(`   ✅ Already has all ${allAdminPermissions.length} individual permissions`);
        alreadyCorrectCount++;
      }
    }
  });
  
  // Persist changes if any were made
  if (changesMade) {
    console.log(`\n💾 Persisting changes to disk...`);
    // Update all roles in the store
    roleActions.updateRoles(roles);
    await store.persistImmediately();
    console.log(`   ✅ Changes persisted`);
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount} admin role(s)`);
  console.log(`   Already correct: ${alreadyCorrectCount} admin role(s)`);
  console.log(`   Total admin roles: ${fixedCount + alreadyCorrectCount}`);
  console.log(`\n✅ Admin role fix script completed!`);
  
  return { fixedCount, alreadyCorrectCount };
};

// Run if called directly
if (require.main === module) {
  const store = require('../store');
  
  // Initialize store first
  store.initialize().then(async () => {
    await fixAdminRole();
    process.exit(0);
  }).catch(error => {
    console.error('Error initializing store:', error);
    process.exit(1);
  });
}

module.exports = { fixAdminRole };
