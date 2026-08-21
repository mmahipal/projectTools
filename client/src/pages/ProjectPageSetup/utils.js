// ProjectPageSetup utilities

// Note: Utilities will be extracted from ProjectPageSetup.js as needed

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString;
};

