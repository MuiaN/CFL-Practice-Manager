import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Building2, Mail, Globe, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system configuration and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Firm Information */}
        <Card data-testid="card-firm-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Firm Information</CardTitle>
            </div>
            <CardDescription>
              Update your law firm's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firm-name" data-testid="label-firm-name">Firm Name</Label>
                <Input
                  id="firm-name"
                  defaultValue="CFL Legal"
                  data-testid="input-firm-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm-location" data-testid="label-firm-location">Location</Label>
                <Input
                  id="firm-location"
                  defaultValue="Kilimani, Nairobi"
                  data-testid="input-firm-location"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="firm-address" data-testid="label-firm-address">Address</Label>
              <Input
                id="firm-address"
                placeholder="Enter full address"
                data-testid="input-firm-address"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firm-phone" data-testid="label-firm-phone">Phone Number</Label>
                <Input
                  id="firm-phone"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  data-testid="input-firm-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm-email" data-testid="label-firm-email">Email</Label>
                <Input
                  id="firm-email"
                  type="email"
                  placeholder="info@cfllegal.co.ke"
                  data-testid="input-firm-email"
                />
              </div>
            </div>
            <Button data-testid="button-save-firm-info">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card data-testid="card-email-config">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure email server settings for notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host" data-testid="label-smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.example.com"
                  data-testid="input-smtp-host"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port" data-testid="label-smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  data-testid="input-smtp-port"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-username" data-testid="label-smtp-username">Username</Label>
              <Input
                id="smtp-username"
                placeholder="noreply@cfllegal.co.ke"
                data-testid="input-smtp-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password" data-testid="label-smtp-password">Password</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="••••••••"
                data-testid="input-smtp-password"
              />
            </div>
            <Button data-testid="button-save-email-config">
              <Save className="h-4 w-4 mr-2" />
              Save Email Settings
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card data-testid="card-system-settings">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>
              Configure system-wide preferences and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout" data-testid="label-session-timeout">
                Session Timeout (minutes)
              </Label>
              <Input
                id="session-timeout"
                type="number"
                defaultValue="60"
                data-testid="input-session-timeout"
              />
              <p className="text-sm text-muted-foreground">
                Users will be logged out after this period of inactivity
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="max-upload-size" data-testid="label-max-upload-size">
                Maximum Upload Size (MB)
              </Label>
              <Input
                id="max-upload-size"
                type="number"
                defaultValue="10"
                data-testid="input-max-upload-size"
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size allowed for document uploads
              </p>
            </div>
            <Button data-testid="button-save-system-settings">
              <Save className="h-4 w-4 mr-2" />
              Save System Settings
            </Button>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card data-testid="card-integration-settings">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Integrations</CardTitle>
            </div>
            <CardDescription>
              Manage third-party integrations and API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" data-testid="label-api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="••••••••••••••••"
                data-testid="input-api-key"
              />
              <p className="text-sm text-muted-foreground">
                API key for external integrations
              </p>
            </div>
            <Button data-testid="button-save-integration-settings">
              <Save className="h-4 w-4 mr-2" />
              Save Integration Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
