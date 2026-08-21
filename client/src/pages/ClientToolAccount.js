const proceedWithBulkUpdate = async () => {
    setUpdating(true);
    try {
      // Update each selected project with its respective CTA from the Actions column
      const updatePromises = bulkSelectedProjects.map(projectId => {
        const accountId = selectedAccounts[projectId];
        return apiClient.post('/client-tool-account/update-mapping', {
          projectId,
          accountId
        });
      });
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.data.success).length;
      
      if (successCount === bulkSelectedProjects.length) {
        toast.success(`Successfully published ${successCount} project(s) to Salesforce`);
        setBulkSelectedProjects([]);
        // Clear selected accounts for published projects
        setSelectedAccounts(prev => {
          const updated = { ...prev };
          bulkSelectedProjects.forEach(projectId => {
            delete updated[projectId];
          });
          return updated;
        });
        // Clear search terms and results for published projects
        setSearchTermsPerProject(prev => {
          const updated = { ...prev };
          bulkSelectedProjects.forEach(projectId => {
            delete updated[projectId];
          });
          return updated;
        });
        setSearchResultsPerProject(prev => {
          const updated = { ...prev };
          bulkSelectedProjects.forEach(projectId => {
            delete updated[projectId];
          });
          return updated;
        });
        fetchContributorProjects();
      } else {
        toast.error(`Failed to publish some projects. ${successCount} of ${bulkSelectedProjects.length} succeeded.`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to publish projects';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };