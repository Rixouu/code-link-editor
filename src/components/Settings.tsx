import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  return (
    <div className="space-y-6 mt-8"> {/* Added mt-8 for a margin-top of 2rem */}
      <div className="space-y-1"> {/* Added this div to group title and description */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Link Enhancement Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">Customize how your links are processed and tracked.</p>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg space-y-6">  
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="useDeepLinks" className="text-base font-semibold text-gray-900 dark:text-white">Use Deep Links</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enable to use app-specific deep linking.</p>
          </div>
          <Switch
            id="useDeepLinks"
            checked={useDeepLinks}
            onCheckedChange={setUseDeepLinks}
          />
        </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="followRedirects" className="text-base font-semibold text-gray-900 dark:text-white">Follow Redirects</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Allow tracking through redirect chains.</p>
          </div>
          <Switch
            id="followRedirects"
            checked={followRedirects}
            onCheckedChange={setFollowRedirects}
          />
        </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="utmSource" className="text-base font-semibold text-gray-900 dark:text-white">UTM Source</Label>
            <Input
              id="utmSource"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className={cn(
                "bg-white dark:bg-gray-600 text-black dark:text-white",
                "border-0 focus:ring-0"
              )}            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Identifies which site sent the traffic, like &apos;google&apos; or &apos;newsletter&apos;.</p>
          </div>

          <div>
            <Label htmlFor="utmMedium" className="text-base font-semibold text-gray-900 dark:text-white">UTM Medium</Label>
            <Input
              id="utmMedium"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className={cn(
                "bg-white dark:bg-gray-600 text-black dark:text-white",
                "border-0 focus:ring-0"
              )}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Identifies the marketing medium, like &apos;cpc&apos; for paid search or &apos;email&apos; for email marketing.</p>
          </div>

          <div>
            <Label htmlFor="utmCampaign" className="text-base font-semibold text-gray-900 dark:text-white">UTM Campaign</Label>
            <Input
              id="utmCampaign"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className={cn(
                "bg-white dark:bg-gray-600 text-black dark:text-white",
                "border-0 focus:ring-0"
              )}            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Identifies a specific product promotion or strategic campaign.</p>
          </div>
        </div>
      </div>
    </div>
  );
}