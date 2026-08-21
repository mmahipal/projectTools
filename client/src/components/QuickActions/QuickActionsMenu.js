import React, { useState, useRef, useEffect } from 'react';
import { Zap, Search, FileText, Download, Bookmark, Clock, Settings, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRecentItems } from '../../utils/crossFeature/recentItems';
import { getBookmarks, removeBookmark } from '../../utils/crossFeature/bookmarks';
import { globalSearch } from '../../utils/crossFeature/globalSearch';
import { exportData } from '../../utils/crossFeature/exportService';
import toast from 'react-hot-toast';

const QuickActionsMenu = ({ trigger, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      loadRecentItems();
      loadBookmarks();
    }
  }, [isOpen]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadRecentItems = () => {
    const recent = getRecentItems().slice(0, 5);
    setRecentItems(recent);
  };

  const loadBookmarks = () => {
    const bookmarksList = getBookmarks().slice(0, 5);
    setBookmarks(bookmarksList);
  };

  const handleSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const results = await globalSearch(query.trim());
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleExportData = () => {
    // Close the menu first
    setIsOpen(false);
    
    // Check current route and try to trigger export
    const currentPath = location.pathname;
    
    // Dispatch a custom event that components can listen to
    const exportEvent = new CustomEvent('quickActionExport', {
      detail: { format: 'excel' }
    });
    window.dispatchEvent(exportEvent);
    
    // Also try to find and click export buttons directly
    setTimeout(() => {
      // Try multiple strategies to find export buttons
      const exportSelectors = [
        'button:has-text("Export")',
        'button[aria-label*="Export"]',
        'button[aria-label*="export"]',
        'button:has(svg[data-lucide="download"])',
        'button:has(svg[data-lucide="Download"])',
        '[data-testid="export-button"]',
        '.export-button',
        'button[class*="export"]'
      ];
      
      let exportButton = null;
      
      // Try to find export button by text content
      const allButtons = Array.from(document.querySelectorAll('button'));
      exportButton = allButtons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        return (
          text.includes('export') ||
          ariaLabel.includes('export') ||
          btn.querySelector('svg[data-lucide="download"]') ||
          btn.querySelector('svg[data-lucide="Download"]')
        );
      });
      
      if (exportButton) {
        exportButton.click();
        toast.success('Exporting data...');
        return;
      }
      
      // For specific pages, try page-specific approaches
      if (currentPath === '/report-builder' || currentPath.startsWith('/report-builder')) {
        // Try to find ReportViewPanel export button
        const reportViewPanel = document.querySelector('[data-testid="report-view-panel"]');
        if (reportViewPanel) {
          const exportBtn = reportViewPanel.querySelector('button:has(svg)');
          if (exportBtn) {
            exportBtn.click();
            // Then try to click Excel option
            setTimeout(() => {
              const excelOption = Array.from(document.querySelectorAll('button, div[role="button"]')).find(
                el => el.textContent?.includes('Excel') || el.textContent?.includes('XLSX')
              );
              if (excelOption) {
                excelOption.click();
                toast.success('Exporting report as Excel...');
              }
            }, 200);
            return;
          }
        }
        
        // If no export button found, show helpful message
        toast('Please open a report view to export it', {
          icon: '📊',
          duration: 3000
        });
      } else if (currentPath === '/client-tool-account') {
        // Try to find "Export to Excel" button
        const exportBtn = allButtons.find(btn => 
          btn.textContent?.includes('Export to Excel') || 
          btn.textContent?.includes('Export')
        );
        if (exportBtn) {
          exportBtn.click();
          toast.success('Exporting client tool account data...');
        } else {
          toast('Navigate to the Management tab and use the "Export to Excel" button', {
            icon: '📑',
            duration: 3000
          });
        }
      } else if (currentPath === '/queue-status-management') {
        // Try to find analytics tab and export button
        const analyticsTab = document.querySelector('button[data-tab="analytics"], button:has-text("Analytics")');
        if (analyticsTab && !analyticsTab.classList.contains('active')) {
          analyticsTab.click();
          setTimeout(() => {
            const exportBtn = allButtons.find(btn => btn.textContent?.includes('Export'));
            if (exportBtn) {
              exportBtn.click();
              toast.success('Exporting queue status data...');
            } else {
              toast('Use the Export button in the Analytics tab', { icon: '📋' });
            }
          }, 500);
        } else {
          const exportBtn = allButtons.find(btn => btn.textContent?.includes('Export'));
          if (exportBtn) {
            exportBtn.click();
            toast.success('Exporting queue status data...');
          } else {
            toast('Navigate to the Analytics tab to export data', { icon: '📋' });
          }
        }
      } else if (currentPath === '/dashboard') {
        toast('Use the export buttons (📥) in individual dashboard widgets to export data', {
          icon: '📈',
          duration: 3000
        });
      } else {
        // Generic message with navigation options
        toast(
          (t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ marginBottom: '4px' }}>This page doesn't have export functionality.</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/report-builder');
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#08979C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Go to Report Builder
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/dashboard');
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ),
          {
            duration: 5000,
            icon: 'ℹ️'
          }
        );
      }
    }, 100);
  };

  const handleBookmarks = () => {
    // Ensure menu is open
    if (!isOpen) {
      setIsOpen(true);
      // Wait for menu to render, then scroll
      setTimeout(() => {
        const bookmarksSection = menuRef.current?.querySelector('[data-section="bookmarks"]');
        if (bookmarksSection) {
          bookmarksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Menu is already open, just scroll to bookmarks
      const bookmarksSection = menuRef.current?.querySelector('[data-section="bookmarks"]');
      if (bookmarksSection) {
        bookmarksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // No bookmarks, show message
        toast('No bookmarks yet. Add bookmarks from any page to see them here.', {
          icon: '📑',
          duration: 3000
        });
      }
    }
  };

  const handleRecentItems = () => {
    // Reload recent items
    loadRecentItems();
    
    // Ensure menu is open
    if (!isOpen) {
      setIsOpen(true);
      // Wait for menu to render, then scroll
      setTimeout(() => {
        const recentSection = menuRef.current?.querySelector('[data-section="recent"]');
        if (recentSection) {
          recentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Menu is already open, just scroll to recent items
      const recentSection = menuRef.current?.querySelector('[data-section="recent"]');
      if (recentSection) {
        recentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // No recent items, show message
        toast('No recent items. Navigate to pages to build your recent items list.', {
          icon: '🕐',
          duration: 3000
        });
      }
    }
  };

  const quickActions = [
    { icon: Search, label: 'Global Search', action: () => {}, isSearch: true },
    { icon: FileText, label: 'Create Report', action: () => handleNavigate('/report-builder') },
    { icon: Download, label: 'Export Data', action: handleExportData },
    { icon: Settings, label: 'Settings', action: () => handleNavigate('/settings') }
  ];

  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' }
  };

  return (
    <div style={{ position: 'relative' }}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            ...positionStyles[position],
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#0176d3',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
        >
          <Zap size={24} />
        </button>
      )}

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            ...positionStyles[position],
            marginBottom: trigger ? '0' : '80px',
            width: '400px',
            maxHeight: '600px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Quick Actions</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search across all features..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Search Results */}
            {searching && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                Searching...
              </div>
            )}

            {searchResults && searchResults.total > 0 && (
              <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(searchResults.results).map(([feature, data]) => (
                  data.items.length > 0 && (
                    <div key={feature} style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px', textTransform: 'capitalize' }}>
                        {feature === 'pages' ? 'Pages' : feature.replace(/_/g, ' ')} ({data.count})
                      </div>
                      {data.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleNavigate(item.path)}
                          style={{
                            padding: '8px 12px',
                            background: '#f9fafb',
                            borderRadius: '4px',
                            marginBottom: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
                        >
                          {item.name || item.contributorProjectName || item.contributorFacingProjectName}
                          {item.category && (
                            <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>
                              • {item.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            )}

            {searchResults && searchResults.total === 0 && searchQuery.trim() !== '' && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                No results found
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Recent Items */}
            <div data-section="recent" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                Recent Items
                {recentItems.length > 0 && <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>({recentItems.length})</span>}
              </div>
              {recentItems.length > 0 ? (
                recentItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleNavigate(item.path)}
                    style={{
                      padding: '8px 12px',
                      background: '#f9fafb',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
                  >
                    {item.name}
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                  No recent items. Navigate to pages to build your recent items list.
                </div>
              )}
            </div>

            {/* Bookmarks */}
            <div data-section="bookmarks" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bookmark size={14} />
                Bookmarks
                {bookmarks.length > 0 && <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>({bookmarks.length})</span>}
              </div>
              {bookmarks.length > 0 ? (
                bookmarks.map((bookmark, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f9fafb',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
                  >
                    <div
                      onClick={() => handleNavigate(bookmark.path)}
                      style={{ flex: 1 }}
                    >
                      {bookmark.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmark(bookmark.type, bookmark.id);
                        loadBookmarks();
                        toast.success('Bookmark removed');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666'
                      }}
                      title="Remove bookmark"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                  No bookmarks yet. Use the bookmark button on any page to add bookmarks.
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                Actions
              </div>
              {quickActions.filter(a => !a.isSearch).map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div
                    key={idx}
                    onClick={action.action}
                    style={{
                      padding: '10px 12px',
                      background: '#f9fafb',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
                  >
                    <Icon size={16} color="#0176d3" />
                    {action.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionsMenu;

