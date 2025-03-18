'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/useToast"
import { extractLinks, Link } from '@/utils/linkUtils';
import { Input } from "@/components/ui/input";
import { Settings } from '@/components/Settings';
import { Link as LinkIcon, Copy as CopyIcon, RotateCcw, TrashIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';

// Dynamically import CodeMirror to reduce initial bundle size
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { 
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full border rounded-md bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading editor...</div>
    </div>
  )
});

type LinkField = 'mainLink' | 'brazeParam' | 'deeplink';

export function LinkWizard() {
  const { toast } = useToast();
  const [originalContent, setOriginalContent] = useState('');
  const [updatedContent, setUpdatedContent] = useState('');
  const [extractedLinks, setExtractedLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New state for link enhancement settings
  const [useDeepLinks, setUseDeepLinks] = useState(true);
  const [followRedirects, setFollowRedirects] = useState(true);
  const [utmSource, setUtmSource] = useState('email');
  const [utmMedium, setUtmMedium] = useState('crm');
  const [utmCampaign, setUtmCampaign] = useState('{{campaign.${name}}}');

  // Memoize the editorOptions
  const editorOptions = useMemo(() => ({
    theme: oneDark,
    height: '300px',
    width: '100%',
    style: { overflow: 'auto' },
    extensions: [html()],
  }), []);

  const handleExtractLinks = () => {
    setIsLoading(true);
    try {
      if (!originalContent.trim()) {
        throw new Error("Please enter some content before extracting links.");
      }
      const links = extractLinks(originalContent);
      if (links.length === 0) {
        throw new Error("No links found in the provided content.");
      }
      setExtractedLinks(links);
      setUpdatedContent(originalContent);
      toast({
        title: "Links Extracted",
        description: `${links.length} links extracted successfully.`,
      });
    } catch (error) {
      console.error('Error extracting links:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred while extracting links.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLink = (index: number, field: LinkField, value: string) => {
    const updatedLinks = [...extractedLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setExtractedLinks(updatedLinks);
  };

  const handleToggleDeeplink = (index: number) => {
    const updatedLinks = [...extractedLinks];
    if (updatedLinks[index].deeplink) {
      // Remove deeplink
      updatedLinks[index].deeplink = '';
    } else {
      // Add deeplink
      updatedLinks[index].deeplink = `&$deep_link=${useDeepLinks}&$follow_redirect=${followRedirects}&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    }
    setExtractedLinks(updatedLinks);
  };

  const handleReset = () => {
    setOriginalContent('');
    setUpdatedContent('');
    setExtractedLinks([]);
    toast({
      title: "Reset",
      description: "Content has been reset.",
    });
  };

  const handleCopyUpdatedContent = () => {
    navigator.clipboard.writeText(updatedContent).then(() => {
      toast({
        title: "Copied",
        description: "Updated content copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy updated content.",
      });
    });
  };

  useEffect(() => {
    let content = originalContent;
    extractedLinks.forEach(link => {
      const fullUrl = `${link.mainLink}${link.brazeParam || ''}${link.deeplink}`;
      content = content.replace(link.fullUrl, fullUrl);
    });
    setUpdatedContent(content);
  }, [extractedLinks, originalContent]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center text-gray-900">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Link Wizard
              </h1>
              <p className="text-sm sm:text-base text-gray-500">Extract links from your content in seconds.</p>
            </div>
          </header>
        </div>

        <div className="p-4 sm:p-8">
          <Tabs defaultValue="editor" className="space-y-4">
            <TabsList className="flex w-full bg-gray-200 p-1 rounded-lg shadow-sm">
              <TabsTrigger 
                value="editor" 
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white data-[state=active]:text-black",
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600",
                  "hover:bg-gray-100"
                )}
              >
                Code Editor
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white data-[state=active]:text-black",
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600",
                  "hover:bg-gray-100"
                )}
              >
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  <div className="w-full sm:w-1/2 space-y-3">
                    <h2 className="text-lg font-medium flex items-center text-gray-900">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Original Content
                    </h2>
                    <div className="relative overflow-hidden border rounded-md w-full max-w-full">
                      <Suspense fallback={
                        <div className="h-[300px] w-full bg-gray-50 flex items-center justify-center">
                          <div className="animate-pulse text-gray-400">Loading editor...</div>
                        </div>
                      }>
                        <CodeMirror
                          value={originalContent}
                          onChange={setOriginalContent}
                          {...editorOptions}
                        />
                      </Suspense>
                    </div>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-3">
                    <h2 className="text-lg font-medium flex items-center text-gray-900">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Updated Content
                    </h2>
                    <div className="relative overflow-hidden border rounded-md w-full max-w-full">
                      <Suspense fallback={
                        <div className="h-[300px] w-full bg-gray-50 flex items-center justify-center">
                          <div className="animate-pulse text-gray-400">Loading editor...</div>
                        </div>
                      }>
                        <CodeMirror
                          value={updatedContent}
                          readOnly
                          {...editorOptions}
                        />
                      </Suspense>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={handleExtractLinks}
                    variant="default"
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Extracting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Extract Links
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCopyUpdatedContent}
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-black border-gray-300 w-full sm:w-auto"
                  >
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Copy Enhanced HTML
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="default"
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-medium flex items-center text-gray-900">
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Extracted Links
                  </h2>
                  <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
                    {extractedLinks.length > 0 ? (
                      <ul className="space-y-6">
                        {extractedLinks.map((link, index) => (
                          <li key={index} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Short Link</label>
                                <Input
                                  value={link.mainLink}
                                  onChange={(e) => handleUpdateLink(index, 'mainLink', e.target.value)}
                                  className="bg-gray-50 text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              {link.brazeParam && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Braze Parameter (non-editable)</label>
                                  <Input
                                    value={link.brazeParam}
                                    readOnly
                                    className="bg-gray-100 text-gray-500 border-gray-300"
                                  />
                                </div>
                              )}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between space-x-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    Deeplink
                                  </label>
                                  <Button
                                    onClick={() => handleToggleDeeplink(index)}
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "transition-colors",
                                      link.deeplink 
                                        ? "bg-red-100 hover:bg-red-200 text-red-600 border-red-200 hover:border-red-300" 
                                        : "bg-green-100 hover:bg-green-200 text-green-600 border-green-200 hover:border-green-300"
                                    )}
                                  >
                                    {link.deeplink ? "Remove" : "Add"}
                                  </Button>
                                </div>
                                {link.deeplink && (
                                  <Input
                                    value={link.deeplink}
                                    onChange={(e) => handleUpdateLink(index, 'deeplink', e.target.value)}
                                    className="w-full mt-2 bg-gray-50 text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                  />
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No links extracted yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <Settings
                useDeepLinks={useDeepLinks}
                setUseDeepLinks={setUseDeepLinks}
                followRedirects={followRedirects}
                setFollowRedirects={setFollowRedirects}
                utmSource={utmSource}
                setUtmSource={setUtmSource}
                utmMedium={utmMedium}
                setUtmMedium={setUtmMedium}
                utmCampaign={utmCampaign}
                setUtmCampaign={setUtmCampaign}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}