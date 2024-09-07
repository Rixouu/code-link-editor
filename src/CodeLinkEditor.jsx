import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Button } from './components/ui/button';
import { Trash2, RefreshCw, Copy, Link, Moon, Sun, Loader2, Plus, X, HelpCircle } from 'lucide-react';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-dark.css';

const Editor = lazy(() => import('react-simple-code-editor'));

// Simple Toast component
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white flex items-center`}>
    <span>{message}</span>
    <button onClick={onClose} className="ml-4">
      <X size={18} />
    </button>
  </div>
);

// Simple Tooltip component
const Tooltip = ({ children, content }) => (
  <div className="relative group">
    {children}
    <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max">
      {content}
      <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
        <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
      </svg>
    </div>
  </div>
);

function CodeLinkEditor() {
  const [originalCode, setOriginalCode] = useState('');
  const [updatedCode, setUpdatedCode] = useState('');
  const [links, setLinks] = useState([]);
  const [deepLinkParams, setDeepLinkParams] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasEdited, setHasEdited] = useState(false);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto-dismiss after 5 seconds
  };

  const getFullLink = useCallback((link) => {
    if (!link.hasDeepLink || !deepLinkParams) return link.fullUrl;
    const [baseUrl, queryString] = link.fullUrl.split('?');
    const params = new URLSearchParams(queryString);
    params.set('$deep_link', deepLinkParams.deepLink);
    params.set('$follow_redirect', deepLinkParams.followRedirect);
    params.set('utm_source', deepLinkParams.utmSource);
    params.set('utm_medium', deepLinkParams.utmMedium);
    params.set('utm_campaign', deepLinkParams.utmCampaign);
    return `${baseUrl}?${decodeURIComponent(params.toString())}`;
  }, [deepLinkParams]);

  const extractLinks = async () => {
    setIsLoading(true);
    try {
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const extractedLinks = [];
      let match;
      let hasAnyDeepLink = false;
      while ((match = linkRegex.exec(originalCode)) !== null) {
        const fullUrl = match[2];
        const [baseUrl, queryString] = fullUrl.split('?');
        const lidMatch = queryString ? queryString.match(/lid=([^&]+)/) : null;
        const hasDeepLink = fullUrl.includes('$deep_link=') && 
                            fullUrl.includes('$follow_redirect=') &&
                            fullUrl.includes('utm_source=') &&
                            fullUrl.includes('utm_medium=') &&
                            fullUrl.includes('utm_campaign=');
        extractedLinks.push({ 
          id: extractedLinks.length + 1, 
          url: baseUrl,
          fullUrl: fullUrl,
          hasDeepLink,
          lid: lidMatch ? lidMatch[1] : null
        });

        if (hasDeepLink) {
          hasAnyDeepLink = true;
        }
      }
      if (extractedLinks.length === 0) {
        throw new Error('No links found in the provided HTML.');
      }
      setLinks(extractedLinks);
      
      if (hasAnyDeepLink) {
        const deepLinkUrl = extractedLinks.find(link => link.hasDeepLink)?.fullUrl;
        if (deepLinkUrl) {
          const params = new URLSearchParams(deepLinkUrl.split('?')[1]);
          setDeepLinkParams({
            deepLink: params.get('$deep_link') || 'true',
            followRedirect: params.get('$follow_redirect') || 'true',
            utmSource: params.get('utm_source') || 'email',
            utmMedium: params.get('utm_medium') || 'crm',
            utmCampaign: params.get('utm_campaign') || '{{campaign.name}}'
          });
        }
      }
      showToast(`Successfully extracted ${extractedLinks.length} links.`, 'success');
    } catch (error) {
      console.error('Error extracting links:', error);
      showToast(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeepLink = (id, action) => {
    if (action === 'delete') {
      setLinks(prevLinks => prevLinks.filter(link => link.id !== id));
    } else {
      setLinks(prevLinks => prevLinks.map(link => {
        if (link.id === id) {
          const newHasDeepLink = !link.hasDeepLink;
          let newFullUrl = link.fullUrl;
          if (newHasDeepLink && deepLinkParams) {
            newFullUrl = getFullLink({ ...link, hasDeepLink: true });
          } else {
            // Remove deep link parameters if they exist
            const [baseUrl, queryString] = link.fullUrl.split('?');
            const params = new URLSearchParams(queryString);
            ['$deep_link', '$follow_redirect', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(param => params.delete(param));
            newFullUrl = params.toString() ? `${baseUrl}?${decodeURIComponent(params.toString())}` : baseUrl;
          }
          return { ...link, hasDeepLink: newHasDeepLink, fullUrl: newFullUrl };
        }
        return link;
      }));
    }
    setHasEdited(true);
  };

  const editLink = (id, newUrl) => {
    try {
      new URL(newUrl); // This will throw an error if the URL is invalid
      setLinks(prevLinks => prevLinks.map(link => 
        link.id === id ? { ...link, url: newUrl } : link
      ));
      setHasEdited(true);
    } catch (error) {
      console.error('Error editing link:', error);
      showToast('Invalid URL. Please enter a valid URL.');
    }
  };

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(updatedCode);
      showToast('Code copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error copying code:', error);
      showToast('Failed to copy code. Please try again.');
    }
  };

  const resetEditor = () => {
    try {
      setOriginalCode('');
      setUpdatedCode('');
      setLinks([]);
      setDeepLinkParams(null);
      setHasEdited(false);
      showToast('Editor reset successfully.', 'success');
    } catch (error) {
      console.error('Error resetting editor:', error);
      showToast('Failed to reset editor. Please try again.');
    }
  };

  const updateDeepLinkParam = (key, value) => {
    setDeepLinkParams(prev => ({ ...prev, [key]: value }));
    setHasEdited(true);
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (hasEdited) {
      try {
        let newCode = originalCode;
        links.forEach(link => {
          const oldUrl = escapeRegExp(link.url);
          const newUrl = decodeURIComponent(link.fullUrl);
          newCode = newCode.replace(new RegExp(`href="${oldUrl}[^"]*"`, 'g'), `href="${newUrl}"`);
        });
        setUpdatedCode(newCode);
      } catch (error) {
        console.error('Error updating code:', error);
        showToast('Failed to update code. Please check your links and try again.');
      }
    }
  }, [links, originalCode, hasEdited]);

  const renderEditor = (code, setCode, readOnly = false) => {
    const lines = code.split('\n');
    const lineNumbers = lines.map((_, i) => i + 1);

    return (
      <div className="relative border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col text-xs text-right pr-2 pt-4 select-none overflow-hidden z-10" style={{
          backgroundColor: theme === 'dark' ? '#252525' : '#f0f0f0',
          color: theme === 'dark' ? '#858585' : '#999999',
          borderRight: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
        }}>
          {lineNumbers.map(num => (
            <div key={num} className="leading-5 px-2">{num}</div>
          ))}
        </div>
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={code => highlight(code, languages.markup)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            height: '100%',
            overflow: 'auto',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: theme === 'dark' ? '#d4d4d4' : '#333333',
            paddingLeft: '3rem',
          }}
          className="h-full overflow-auto"
          readOnly={readOnly}
        />
      </div>
    );
  };
  
  return (
<div className={`code-link-editor p-8 max-w-6xl mx-auto ${theme === 'dark' ? 'bg-gray-900 text-white prism-dark' : 'bg-gray-50 text-gray-800 prism-light'} rounded-xl shadow-2xl transition-colors duration-200`}>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold flex items-center">
          <Link className="w-8 h-8 mr-3 text-blue-500" />
          Code and Link Editor
        </h1>
        <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          <Button onClick={toggleTheme} variant="outline" size="icon">
            {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </Tooltip>
      </header>
      
      <div className="editor-section mb-8 flex space-x-4">
        <div className="w-1/2">
          <h2 className="text-xl font-semibold mb-2">Original Code</h2>
          <Suspense fallback={<div>Loading editor...</div>}>
            {renderEditor(originalCode, setOriginalCode)}
          </Suspense>
        </div>
        <div className="w-1/2">
          <h2 className="text-xl font-semibold mb-2">Updated Code</h2>
          <Suspense fallback={<div>Loading editor...</div>}>
            {renderEditor(updatedCode, () => {}, true)}
          </Suspense>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-4">
        <Tooltip content="Extract links from the original code">
          <Button onClick={extractLinks} className="bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Extract Links
          </Button>
        </Tooltip>
        <Tooltip content="Copy the updated code to clipboard">
          <Button onClick={copyCode} className="bg-green-500 hover:bg-green-600 text-white">
            <Copy className="w-4 h-4 mr-2" />
            Copy Updated Code
          </Button>
        </Tooltip>
        <Tooltip content="Reset the editor to its initial state">
          <Button onClick={resetEditor} className="bg-red-500 hover:bg-red-600 text-white">
            <Trash2 className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </Tooltip>
      </div>

      {deepLinkParams && (
        <div className="deep-link-params-section mb-8 mt-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            Deep Link Parameters
            <Tooltip content="These parameters will be added to links with deep linking enabled">
              <HelpCircle className="w-5 h-5 ml-2 text-gray-500" />
            </Tooltip>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(deepLinkParams).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <label className="mb-2 font-medium">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateDeepLinkParam(key, e.target.value)}
                  className={`p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="extracted-links-section">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Link className="w-6 h-6 mr-2 text-blue-500" />
          Extracted Links
        </h2>
        <div className="space-y-6">
          {links.map((link) => (
            <div key={link.id} className={`p-6 rounded-xl shadow-md transition duration-300 hover:shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ${!link.hasDeepLink ? 'border-2 border-yellow-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-lg">Link {link.id}</span>
                <div className="flex space-x-2">
                  {!link.hasDeepLink && (
                    <Tooltip content="Add deep linking">
                      <Button 
                        onClick={() => toggleDeepLink(link.id, 'toggle')} 
                        variant="outline" 
                        size="sm" 
                        className="text-green-500 hover:bg-green-50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                  {link.hasDeepLink && (
                    <Tooltip content="Remove deep linking">
                      <Button 
                        onClick={() => toggleDeepLink(link.id, 'toggle')} 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip content="Delete link">
                    <Button 
                      onClick={() => toggleDeepLink(link.id, 'delete')} 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <input
                type="text"
                value={link.url}
                onChange={(e) => editLink(link.id, e.target.value)}
                className={`w-full p-3 mb-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
              />
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-sm font-semibold mb-2">Full link:</p>
                <p className="text-xs break-all">{link.fullUrl}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default CodeLinkEditor;