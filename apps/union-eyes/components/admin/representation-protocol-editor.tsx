/**
 * Representation Protocol Editor
 *
 * Admin panel for choosing a protocol preset or customising steward permissions
 * per-org. Persisted via /api/admin/representation-protocol.
 *
 * @module components/admin/representation-protocol-editor
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Save, CheckCircle } from "lucide-react";
import {
  type RepresentativeType,
  type RepresentationProtocol,
  PROTOCOL_PRESETS,
  PROTOCOL_STEWARD_LED,
} from "@/lib/representation/protocol-types";

// ─── Preset metadata ─────────────────────────────────────────

const PRESET_META: Record<RepresentativeType, { label: string; description: string }> = {
  steward: {
    label: "Steward-Led",
    description: "Traditional model — stewards file, manage, and represent grievances end-to-end.",
  },
  lro: {
    label: "LRO-Led (CAPE)",
    description: "Labour Relations Officers handle all representation. Stewards are floor contacts only.",
  },
  national_rep: {
    label: "National Rep-Led (CUPE)",
    description: "National Representatives file and manage grievances. Stewards liaise with management.",
  },
  officer: {
    label: "Officer-Led",
    description: "Union officers handle all cases directly. Stewards assist but don't lead.",
  },
};

// ─── Component ────────────────────────────────────────────────

export function RepresentationProtocolEditor() {
  const [protocol, setProtocol] = useState<RepresentationProtocol>(PROTOCOL_STEWARD_LED);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch current protocol
  const fetchProtocol = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/representation-protocol");
      if (res.ok) {
        const data = await res.json();
        setProtocol(data.protocol ?? PROTOCOL_STEWARD_LED);
      }
    } catch {
      // Fall back to steward-led on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocol();
  }, []);

  // Save protocol
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/representation-protocol", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Failed silently — UI state already reflects current value
    } finally {
      setSaving(false);
    }
  };

  // Select a preset
  const selectPreset = (type: RepresentativeType) => {
    setProtocol({ ...PROTOCOL_PRESETS[type] });
  };

  // Toggle a steward permission
  const togglePermission = (key: keyof RepresentationProtocol["stewardPermissions"]) => {
    setProtocol((prev) => ({
      ...prev,
      stewardPermissions: {
        ...prev.stewardPermissions,
        [key]: !prev.stewardPermissions[key],
      },
    }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading representation protocol…</span>
        </div>
      </Card>
    );
  }

  const presetTypes: RepresentativeType[] = ["steward", "lro", "national_rep", "officer"];

  const permissionLabels: Record<keyof RepresentationProtocol["stewardPermissions"], string> = {
    canFileGrievance: "File grievances",
    canRepresent: "Represent members in hearings",
    canBeAssigned: "Eligible for auto-assignment",
    canContactEmployer: "Contact employer on behalf of union",
    canEscalate: "Escalate cases without officer approval",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Representation Protocol</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure who files and manages grievances in your union.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
              <CheckCircle className="h-3 w-3" /> Saved
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Protocol Preset</CardTitle>
          <CardDescription>
            Choose a model that matches your union&apos;s structure, or customise permissions below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presetTypes.map((type) => {
              const meta = PRESET_META[type];
              const isActive = protocol.primaryRepresentative === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectPreset(type)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    isActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                  {isActive && (
                    <Badge className="mt-2" variant="secondary">
                      Active
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Steward Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steward Permissions</CardTitle>
          <CardDescription>
            Fine-tune what stewards can do, regardless of the primary representative model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(permissionLabels) as (keyof RepresentationProtocol["stewardPermissions"])[]).map(
            (key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label htmlFor={key} className="text-sm">
                  {permissionLabels[key]}
                </Label>
                <Switch
                  id={key}
                  checked={protocol.stewardPermissions[key]}
                  onCheckedChange={() => togglePermission(key)}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Internal notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>
            Optional internal notes — e.g. &ldquo;Per bylaws Article 7, LROs handle all representation.&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={protocol.notes ?? ""}
            onChange={(e) => setProtocol((prev) => ({ ...prev, notes: e.target.value || undefined }))}
            placeholder="Internal notes about this protocol…"
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
