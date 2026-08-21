import { useState, useCallback } from 'react';

export const useQueryBuilder = () => {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    objects: [], // Array of { objectType, fields: [], filters: [], relationships: [], subqueries: [] }
    // Legacy support - keep objectType for backward compatibility
    objectType: '',
    fields: [],
    relationships: [],
    subqueries: [],
    filters: [],
    sortBy: null,
    sortOrder: 'ASC',
    groupBy: null,
    limit: 10000,
    category: 'Uncategorized'
  });

  const updateConfig = useCallback((updates) => {
    setReportConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Load a saved report configuration
  const loadReport = useCallback((report) => {
    if (!report) return;
    
    // Normalize the report configuration
    const normalizedConfig = {
      name: report.name || '',
      category: report.category || 'Uncategorized',
      sortBy: report.sortBy || null,
      sortOrder: report.sortOrder || 'ASC',
      groupBy: report.groupBy || null,
      limit: report.limit || 10000,
      // Check if multi-object mode
      objects: report.objects && Array.isArray(report.objects) && report.objects.length > 0
        ? report.objects.map(obj => ({
            objectType: obj.objectType,
            fields: obj.fields || [],
            filters: obj.filters || [],
            relationships: obj.relationships || [],
            subqueries: obj.subqueries || []
          }))
        : [],
      // Legacy single-object mode
      objectType: report.objectType || '',
      fields: report.fields || [],
      relationships: report.relationships || [],
      subqueries: report.subqueries || [],
      filters: report.filters || [],
      // Preserve report ID and timestamps for updates
      id: report.id,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    };
    
    setReportConfig(normalizedConfig);
  }, []);

  // Add a new object to the report
  const addObject = useCallback((objectType) => {
    setReportConfig(prev => {
      // Check if object already exists
      if (prev.objects.some(obj => obj.objectType === objectType)) {
        return prev;
      }
      const newObject = {
        objectType,
        fields: [],
        relationships: [],
        subqueries: [],
        filters: []
      };
      return {
        ...prev,
        objects: [...prev.objects, newObject],
        // For backward compatibility, set objectType to first object
        objectType: prev.objects.length === 0 ? objectType : prev.objectType
      };
    });
  }, []);

  // Remove an object from the report
  const removeObject = useCallback((objectType) => {
    setReportConfig(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.objectType !== objectType),
      // Update objectType if it was the removed one
      objectType: prev.objectType === objectType 
        ? (prev.objects.length > 1 ? prev.objects.find(obj => obj.objectType !== objectType)?.objectType || '' : '')
        : prev.objectType
    }));
  }, []);

  // Add field to a specific object
  const addFieldToObject = useCallback((objectType, field) => {
    setReportConfig(prev => {
      const fieldName = typeof field === 'string' ? field : field.name;
      const updatedObjects = prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          // Check if field already exists
          if (obj.fields.some(f => {
            const fName = typeof f === 'string' ? f : f.name;
            return fName === fieldName;
          })) {
            return obj;
          }
          return {
            ...obj,
            fields: [...obj.fields, field]
          };
        }
        return obj;
      });
      return { ...prev, objects: updatedObjects };
    });
  }, []);

  // Remove field from a specific object
  const removeFieldFromObject = useCallback((objectType, fieldName) => {
    setReportConfig(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          return {
            ...obj,
            fields: obj.fields.filter(f => {
              const fName = typeof f === 'string' ? f : f.name;
              return fName !== fieldName;
            })
          };
        }
        return obj;
      })
    }));
  }, []);

  // Reorder fields within a specific object
  const reorderFieldsInObject = useCallback((objectType, fromIndex, toIndex) => {
    setReportConfig(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          const newFields = [...obj.fields];
          const [movedField] = newFields.splice(fromIndex, 1);
          newFields.splice(toIndex, 0, movedField);
          return {
            ...obj,
            fields: newFields
          };
        }
        return obj;
      })
    }));
  }, []);

  // Add relationship to a specific object
  const addRelationshipToObject = useCallback((objectType, relationship) => {
    setReportConfig(prev => {
      const updatedObjects = prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          if (obj.relationships.some(r => r.relationshipName === relationship.relationshipName)) {
            return obj;
          }
          return {
            ...obj,
            relationships: [...obj.relationships, relationship]
          };
        }
        return obj;
      });
      return { ...prev, objects: updatedObjects };
    });
  }, []);

  // Remove relationship from a specific object
  const removeRelationshipFromObject = useCallback((objectType, relationshipName) => {
    setReportConfig(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          return {
            ...obj,
            relationships: obj.relationships.filter(r => r.relationshipName !== relationshipName),
            fields: obj.fields.filter(f => {
              const fName = typeof f === 'string' ? f : f.name;
              return !fName.startsWith(`${relationshipName}.`);
            })
          };
        }
        return obj;
      })
    }));
  }, []);

  // Add subquery to a specific object
  const addSubqueryToObject = useCallback((objectType, subquery) => {
    setReportConfig(prev => {
      const updatedObjects = prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          if (obj.subqueries.some(s => s.relationshipName === subquery.relationshipName)) {
            return obj;
          }
          return {
            ...obj,
            subqueries: [...obj.subqueries, subquery]
          };
        }
        return obj;
      });
      return { ...prev, objects: updatedObjects };
    });
  }, []);

  // Remove subquery from a specific object
  const removeSubqueryFromObject = useCallback((objectType, relationshipName) => {
    setReportConfig(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          return {
            ...obj,
            subqueries: obj.subqueries.filter(s => s.relationshipName !== relationshipName),
            fields: obj.fields.filter(f => {
              const fName = typeof f === 'string' ? f : f.name;
              return !fName.startsWith(`SUBQUERY:${relationshipName}.`);
            })
          };
        }
        return obj;
      })
    }));
  }, []);

  // Add filter to a specific object
  const addFilterToObject = useCallback((objectType, filter) => {
    setReportConfig(prev => {
      const updatedObjects = prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          return {
            ...obj,
            filters: [...obj.filters, filter]
          };
        }
        return obj;
      });
      return { ...prev, objects: updatedObjects };
    });
  }, []);

  // Remove filter from a specific object
  const removeFilterFromObject = useCallback((objectType, filterIndex) => {
    setReportConfig(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.objectType === objectType) {
          return {
            ...obj,
            filters: obj.filters.filter((_, index) => index !== filterIndex)
          };
        }
        return obj;
      })
    }));
  }, []);

  const addField = useCallback((field) => {
    setReportConfig(prev => {
      const fieldName = typeof field === 'string' ? field : field.name;
      if (prev.fields.some(f => {
        const fName = typeof f === 'string' ? f : f.name;
        return fName === fieldName;
      })) {
        return prev;
      }
      return {
        ...prev,
        fields: [...prev.fields, field]
      };
    });
  }, []);

  const removeField = useCallback((fieldName) => {
    setReportConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => {
        const fName = typeof f === 'string' ? f : f.name;
        return fName !== fieldName;
      })
    }));
  }, []);

  const addRelationship = useCallback((relationship) => {
    setReportConfig(prev => {
      if (prev.relationships.some(r => r.relationshipName === relationship.relationshipName)) {
        return prev;
      }
      return {
        ...prev,
        relationships: [...prev.relationships, relationship]
      };
    });
  }, []);

  const removeRelationship = useCallback((relationshipName) => {
    setReportConfig(prev => ({
      ...prev,
      relationships: prev.relationships.filter(r => r.relationshipName !== relationshipName),
      // Also remove fields from this relationship
      fields: prev.fields.filter(f => {
        const fName = typeof f === 'string' ? f : f.name;
        return !fName.startsWith(`${relationshipName}.`);
      })
    }));
  }, []);

  const addSubquery = useCallback((subquery) => {
    setReportConfig(prev => {
      if (prev.subqueries.some(s => s.relationshipName === subquery.relationshipName)) {
        return prev;
      }
      return {
        ...prev,
        subqueries: [...prev.subqueries, subquery]
      };
    });
  }, []);

  const removeSubquery = useCallback((relationshipName) => {
    setReportConfig(prev => ({
      ...prev,
      subqueries: prev.subqueries.filter(s => s.relationshipName !== relationshipName),
      // Also remove fields from this subquery
      fields: prev.fields.filter(f => {
        const fName = typeof f === 'string' ? f : f.name;
        return !fName.startsWith(`SUBQUERY:${relationshipName}.`);
      })
    }));
  }, []);

  const addFilter = useCallback((filter) => {
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, filter]
    }));
  }, []);

  const removeFilter = useCallback((filterIndex) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, index) => index !== filterIndex)
    }));
  }, []);

  const updateSort = useCallback((sortBy, sortOrder = 'ASC') => {
    setReportConfig(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }));
  }, []);

  const updateGroupBy = useCallback((groupBy) => {
    setReportConfig(prev => ({
      ...prev,
      groupBy
    }));
  }, []);

  return {
    reportConfig,
    updateConfig,
    loadReport,
    // Legacy single-object methods (for backward compatibility)
    addField,
    removeField,
    addRelationship,
    removeRelationship,
    addSubquery,
    removeSubquery,
    addFilter,
    removeFilter,
    updateSort,
    updateGroupBy,
    // New multi-object methods
    addObject,
    removeObject,
    addFieldToObject,
    removeFieldFromObject,
    reorderFieldsInObject,
    addRelationshipToObject,
    removeRelationshipFromObject,
    addSubqueryToObject,
    removeSubqueryFromObject,
    addFilterToObject,
    removeFilterFromObject
  };
};

