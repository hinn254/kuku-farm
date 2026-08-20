import Link from "next/link";
import { getCurrentFarmContext } from "@/lib/farm";
import { updateFarmSettingsAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FarmSettingsPage() {
  const { farm, membership } = await getCurrentFarmContext();
  const isOwner = membership.role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Farm settings
          </h1>
          <p className="text-muted-foreground">
            Name, slug, timezone, and currency
          </p>
        </div>
        <Link
          href="/onboarding?new=1"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Create another farm
        </Link>
      </div>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={updateFarmSettingsAction}
              successMessage="Farm settings saved"
              className="grid max-w-lg gap-3"
            >
              <input type="hidden" name="farmId" value={farm.id} />
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={farm.name} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Shop slug</Label>
                <Input id="slug" name="slug" defaultValue={farm.slug} required />
                <p className="text-xs text-muted-foreground">
                  Public URL: /shop/{farm.slug}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  name="timezone"
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                  defaultValue={farm.timezone}
                >
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Africa/Accra">Africa/Accra</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                  defaultValue={farm.currency}
                >
                  <option value="KES">KES</option>
                  <option value="NGN">NGN</option>
                  <option value="GHS">GHS</option>
                  <option value="ZAR">ZAR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <Button type="submit" className="w-fit bg-[#2d6a4f] hover:bg-[#245a42]">
                Save settings
              </Button>
            </ActionForm>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only owners can edit farm settings.
        </p>
      )}
    </div>
  );
}
