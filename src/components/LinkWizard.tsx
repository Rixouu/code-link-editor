'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/useToast"
import { extractLinks, Link } from '@/utils/linkUtils';
import { Input } from "@/components/ui/input";
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { Settings } from '@/components/Settings';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link as LinkIcon, Copy as CopyIcon, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils";

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
      const links = extractLinks(originalContent);
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
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
      updatedLinks[index].deeplink = '';
    } else {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 p-8">
      <div className="w-full max-w-7xl bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 space-y-4">
          <header className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold flex items-center text-gray-900 dark:text-white">
                <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Link Wizard
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400">Extract links from your content in seconds.</p>
            </div>
            <ThemeToggle />
          </header>
        </div>

        <div className="p-8">
          <Tabs defaultValue="editor" className="space-y-4">
            <TabsList className="flex w-full bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
              <TabsTrigger
                value="editor"
                className={cn(
                  "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black dark:focus:ring-white",
                  "data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700",
                  "data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400",
                  "data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-600"
                )}
              >
                Link Editor
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className={cn(
                  "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black dark:focus:ring-white",
                  "data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700",
                  "data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400",
                  "data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-600"
                )}
              >
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <div className="space-y-8">
                <div className="flex space-x-4">
                  <div className="w-1/2 space-y-3">
                    <h2 className="text-lg font-medium flex items-center text-gray-900 dark:text-white">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Original Content
                    </h2>
                    <div className="relative overflow-hidden border rounded-md w-full max-w-full dark:border-gray-700">
                      <CodeMirror
                        value={originalContent}
                        onChange={(value) => setOriginalContent(value)}
                        {...editorOptions}
                      />
                    </div>
                  </div>
                  <div className="w-1/2 space-y-3">
                    <h2 className="text-lg font-medium flex items-center text-gray-900 dark:text-white">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Updated Content
                    </h2>
                    <div className="relative overflow-hidden border rounded-md w-full max-w-full dark:border-gray-700">
                      <CodeMirror
                        value={updatedContent}
                        readOnly={true}
                        {...editorOptions}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={handleExtractLinks}
                    variant="default"
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white"
                    disabled={isLoading}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {isLoading ? 'Extracting...' : 'Extract Links'}
                  </Button>
                  <Button
                    onClick={handleCopyUpdatedContent}
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-black border-gray-300"
                  >
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Copy Enhanced HTML
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="default"
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-medium flex items-center text-gray-900 dark:text-white">
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Extracted Links
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border dark:border-gray-700">
                    {extractedLinks.length > 0 ? (
                      <ul className="space-y-6">
                        {extractedLinks.map((link, index) => (
                          <li key={index} className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Link</label>
                                <Input
                                  value={link.mainLink}
                                  onChange={(e) => handleUpdateLink(index, 'mainLink', e.target.value)}
                                  className={cn(
                                    "bg-gray-50 dark:bg-gray-600 text-black dark:text-white",
                                    "border-0 focus:ring-0"
                                  )}
                                />
                              </div>
                              {link.brazeParam && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Braze Parameter (non-editable)</label>
                                  <Input
                                    value={link.brazeParam}
                                    readOnly
                                    className={cn(
                                      "bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400",
                                      "border-0 focus:ring-0"
                                    )}
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Remove Deeplink</label>
                                <Switch
                                  checked={!link.deeplink}
                                  onCheckedChange={() => handleToggleDeeplink(index)}
                                />
                              </div>
                              {link.deeplink && (
                                <div>
                                  <Input
                                    value={link.deeplink}
                                    onChange={(e) => handleUpdateLink(index, 'deeplink', e.target.value)}
                                    className={cn(
                                      "bg-gray-50 dark:bg-gray-600 text-black dark:text-white",
                                      "border-0 focus:ring-0"
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No links extracted yet.</p>
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