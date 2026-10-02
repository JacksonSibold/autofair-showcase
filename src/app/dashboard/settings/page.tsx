"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("50");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setName(data.full_name ?? "");
        setZip(data.zip_code ?? "");
        setRadius(String(data.max_drive_radius_miles ?? 50));
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      full_name: name,
      zip_code: zip,
      max_drive_radius_miles: parseInt(radius),
    }).eq("id", user.id);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Home ZIP Code</Label>
          <Input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="75001"
            maxLength={5}
            className="bg-background border-border"
          />
          <p className="text-xs text-muted-foreground">Used for regional pricing and dealer search radius.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Default Drive Radius (miles)</Label>
          <Input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            min="10"
            max="500"
            className="bg-background border-border"
          />
        </div>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 text-green-400" /> Saved!</>
          ) : (
            "Save Settings"
          )}
        </Button>
      </form>
    </div>
  );
}
