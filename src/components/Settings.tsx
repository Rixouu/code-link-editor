import React from 'react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SettingsProps {
  useDeepLinks: boolean;
  setUseDeepLinks: (value: boolean) => void;
  followRedirects: boolean;
  setFollowRedirects: (value: boolean) => void;
  utmSource: string;
  setUtmSource: (value: string) => void;
  utmMedium: string;
  setUtmMedium: (value: string) => void;
  utmCampaign: string;
  setUtmCampaign: (value: string) => void;
}

export function Settings({
  useDeepLinks,
  setUseDeepLinks,
  followRedirects,
  setFollowRedirects,
  utmSource,
  setUtmSource,
  utmMedium,
  setUtmMedium,
  utmCampaign,
  setUtmCampaign
}: SettingsProps) {
  const validateAndSetUtmParam = (value: string, setter: (value: string) => void) => {
    const sanitizedValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
    setter(sanitizedValue);
  };

  return (
    <div className="space-y-6 mt-4 px-4 sm:px-0">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Link Enhancement Settings</h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Customize how your links are processed and tracked.</p>
      </div>

      <div className="space-y-4">
        {[
          { id: "useDeepLinks", label: "Use Deep Links", description: "Enable to use app-specific deep linking.", checked: useDeepLinks, onChange: setUseDeepLinks },
          { id: "followRedirects", label: "Follow Redirects", description: "Allow tracking through redirect chains.", checked: followRedirects, onChange: setFollowRedirects },
        ].map(({ id, label, description, checked, onChange }) => (
          <div key={id} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <Label htmlFor={id} className="text-base font-semibold text-gray-900 dark:text-white">{label}</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <Switch
                id={id}
                checked={checked}
                onCheckedChange={onChange}
                className={cn(
                  "w-11 h-6 mt-2 sm:mt-0",
                  "!bg-red-500 dark:!bg-red-700",
                  "data-[state=checked]:!bg-green-500 dark:data-[state=checked]:!bg-green-600",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                )}
              >
                <span className={cn(
                  "block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200",
                  "data-[state=checked]:translate-x-5"
                )} />
              </Switch>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">UTM Parameters</h3>
        {[
          { id: "utmSource", label: "UTM Source", value: utmSource, setValue: setUtmSource, description: "Identifies which site sent the traffic, e.g., 'google' or 'newsletter'." },
          { id: "utmMedium", label: "UTM Medium", value: utmMedium, setValue: setUtmMedium, description: "Identifies the marketing medium, e.g., 'cpc' for paid search or 'email' for email marketing." },
          { id: "utmCampaign", label: "UTM Campaign", value: utmCampaign, setValue: setUtmCampaign, description: "Identifies a specific product promotion or strategic campaign." },
        ].map(({ id, label, value, setValue, description }) => (
          <div key={id} className="space-y-1">
            <Label htmlFor={id} className="text-base font-semibold text-gray-900 dark:text-white">{label}</Label>
            <Input
              id={id}
              value={value}
              onChange={(e) => validateAndSetUtmParam(e.target.value, setValue)}
              className={cn(
                "mt-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white",
                "border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              )}
            />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}