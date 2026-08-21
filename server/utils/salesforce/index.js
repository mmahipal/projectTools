// Export all Salesforce utilities

module.exports = {
  ...require('./dataStorage'),
  ...require('./encryption'),
  asyncHandler: require('./asyncHandler')
};

