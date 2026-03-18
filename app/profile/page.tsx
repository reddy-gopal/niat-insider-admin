"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/useToast";
import { AdminProfileSection } from "@/components/layout/AdminProfileSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type MeResponse = {
  id: string;
  username: string;
  email?: string | null;
  role: string;
  is_verified_senior?: boolean;
  phone_number?: string | null;
  phone_verified?: boolean;
};

function extractErrorMessage(error: unknown, fallback: string) {
  const e = error as {
    response?: { data?: Record<string, unknown> | { detail?: string } };
    message?: string;
  };
  const data = e?.response?.data;
  if (data && typeof data === "object") {
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    const firstKey = Object.keys(data)[0];
    const firstVal = (data as Record<string, unknown>)[firstKey];
    if (Array.isArray(firstVal) && typeof firstVal[0] === "string") return firstVal[0];
    if (typeof firstVal === "string") return firstVal;
  }
  return e?.message || fallback;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get<MeResponse>("/api/auth/me/")
      .then((res) => {
        if (cancelled) return;
        const profile = res.data;
        setMe(profile);
        setUsername(profile.username || "");
        setEmail(profile.email || "");
        setPhoneNumber(profile.phone_number || "");
      })
      .catch((error) => {
        if (cancelled) return;
        toast({
          title: "Failed to load profile",
          description: extractErrorMessage(error, "Please try again."),
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleProfileSave = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        username: username.trim(),
        email: email.trim() || null,
        phone_number: phoneNumber.trim() || null,
      };
      const res = await api.patch<MeResponse>("/api/auth/me/", payload);
      setMe(res.data);
      setUsername(res.data.username || "");
      setEmail(res.data.email || "");
      setPhoneNumber(res.data.phone_number || "");
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({
        title: "Unable to update profile",
        description: extractErrorMessage(error, "Please check the values and try again."),
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({
        title: "Password fields are required",
        description: "Enter current and new password.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Weak password",
        description: "New password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Confirm password must match new password.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await api.post("/api/auth/change-password/", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated successfully" });
    } catch (error) {
      toast({
        title: "Unable to change password",
        description: extractErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Link>
          <AdminProfileSection />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-400">Role</p>
                <p className="font-medium text-zinc-100">{(me?.role || "admin").toUpperCase()}</p>
              </div>
              <div>
                <p className="text-zinc-400">Verified phone</p>
                <p className="font-medium text-zinc-100">{me?.phone_verified ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-400">
                <div className="mb-1 inline-flex items-center gap-1 text-zinc-300">
                  <ShieldCheck className="h-4 w-4" />
                  Security
                </div>
                Keep your phone number and password updated so your admin access remains secure.
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-zinc-200">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-white"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-white"
                      placeholder="Enter email (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-zinc-200">Mobile Number</Label>
                    <Input
                      id="phone_number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-white"
                      placeholder="+91XXXXXXXXXX"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#991b1b] text-white hover:bg-[#7f1d1d]"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-zinc-200">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-zinc-200">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-zinc-200">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-[#991b1b] text-white hover:bg-[#7f1d1d]"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
