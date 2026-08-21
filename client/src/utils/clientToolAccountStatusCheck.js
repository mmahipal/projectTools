/**
 * Client Tool Account Status Check
 * Checks for inactive/deactivated accounts
 */

/**
 * Checks if an account is inactive or deactivated
 * @param {Object} account - The account object
 * @returns {Object} - { isActive: boolean, status: string, warnings: Array<string> }
 */
export const checkAccountStatus = (account) => {
  if (!account) {
    return {
      isActive: false,
      status: 'not_found',
      warnings: ['Account not found']
    };
  }

  const warnings = [];
  let isActive = true;
  let status = 'active';

  // Check deactivated status
  if (account.deactivated === true || account.deactivated === 'true' || account.deactivated === 'TRUE') {
    isActive = false;
    status = 'deactivated';
    warnings.push('Account is deactivated');
  }

  // Check OTP limit exceeded
  if (account.otpLimitExceeded === true || account.otpLimitExceeded === 'true' || account.otpLimitExceeded === 'TRUE') {
    warnings.push('OTP limit exceeded');
  }

  // Check verified status
  if (account.verified === false || account.verified === 'false' || account.verified === 'FALSE') {
    warnings.push('Account is not verified');
  }

  return {
    isActive,
    status,
    warnings
  };
};

/**
 * Checks status for multiple accounts
 * @param {Array} accounts - Array of account objects
 * @returns {Object} - Map of accountId to status check result
 */
export const checkMultipleAccountStatus = (accounts) => {
  const statusMap = {};

  accounts.forEach(account => {
    if (account && account.id) {
      statusMap[account.id] = checkAccountStatus(account);
    }
  });

  return statusMap;
};

/**
 * Filters active accounts from a list
 * @param {Array} accounts - Array of account objects
 * @returns {Array} - Array of active accounts
 */
export const filterActiveAccounts = (accounts) => {
  return accounts.filter(account => {
    const status = checkAccountStatus(account);
    return status.isActive;
  });
};

/**
 * Gets accounts with warnings
 * @param {Array} accounts - Array of account objects
 * @returns {Array} - Array of accounts with warnings
 */
export const getAccountsWithWarnings = (accounts) => {
  return accounts.filter(account => {
    const status = checkAccountStatus(account);
    return status.warnings.length > 0;
  });
};

