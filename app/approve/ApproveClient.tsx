"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { getCampusOptions } from "@/lib/api/articles";
import type { AdminCampusOption } from "@/lib/api/articles";
import { 
  Clock, 
  IdCard, 
  GraduationCap, 
  Calendar, 
  Mail, 
  Phone, 
  Linkedin, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle, 
  User, 
  Loader2, 
  X,
  FileText,
  RefreshCw,
  Search,
  CheckCircle,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

// Define the interface for the moderation API profiles
interface Profile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  date_applied: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string;
  student_id_number: string;
  campus_name: string;
  linkedin_profile: string;
  bio: string;
  id_card_file: string | null;
  profile_picture: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  updated_at: string;
}

// Define the interface for the verified profiles
interface VerifiedProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  student_id_number: string;
  campus_name: string;
  verified_at: string;
  linkedin_profile: string | null;
  profile_picture: string | null;
  id_card_file: string | null;
  bio: string;
  year_joined: number | null;
}

export function ApproveClient() {
  const { toast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");

  // ================= PENDING MODERATION STATES =================
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState<boolean>(true);
  const [pendingError, setPendingError] = useState<string | null>(null);

  // Detail Modal/Drawer States
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isActionPending, setIsActionPending] = useState<boolean>(false);

  // ================= VERIFIED STUDENTS STATES =================
  const [verifiedProfiles, setVerifiedProfiles] = useState<VerifiedProfile[]>([]);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [isVerifiedLoading, setIsVerifiedLoading] = useState<boolean>(true);
  const [verifiedError, setVerifiedError] = useState<string | null>(null);

  // Filters & Pagination for Verified
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [verifiedSearch, setVerifiedSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [campuses, setCampuses] = useState<AdminCampusOption[]>([]);
  const [verifiedStartIndex, setVerifiedStartIndex] = useState<number>(1);
  const [startIndexHistory, setStartIndexHistory] = useState<number[]>([1]);

  // ================= DEBOUNCE EFFECT FOR SEARCH =================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(verifiedSearch);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [verifiedSearch]);

  // ================= FETCH CAMPUSES =================
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const list = await getCampusOptions();
        setCampuses(list);
      } catch (err) {
        console.error("Failed to load campuses", err);
      }
    };
    fetchCampuses();
  }, []);

  // ================= PENDING ACTIONS =================
  const fetchPendingProfiles = useCallback(async () => {
    setIsPendingLoading(true);
    setPendingError(null);
    try {
      const res = await api.get("/api/moderation/niat-profiles/?status=pending");
      setPendingProfiles(res.data.results ?? []);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to load pending profiles";
      setPendingError(errMsg);
      toast({
        title: "Error Loading Pending Profiles",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsPendingLoading(false);
    }
  }, [toast]);

  // Fetch pending profiles on tab load
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingProfiles();
    }
  }, [activeTab, fetchPendingProfiles]);

  // Fetch single profile details when card is clicked
  const handleViewDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);
    setRejectionReason("");
    
    const foundBase = pendingProfiles.find((p) => p.id === id);
    if (foundBase) {
      setSelectedProfile(foundBase);
    }
    
    try {
      const res = await api.get(`/api/moderation/niat-profiles/${id}/`);
      setSelectedProfile(res.data);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to retrieve student details";
      setDetailError(errMsg);
      toast({
        title: "Error fetching details",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Approve a student profile
  const handleApprove = async (id: number) => {
    setIsActionPending(true);
    try {
      await api.post(`/api/moderation/niat-profiles/${id}/approve/`);
      
      toast({
        title: "Profile Approved",
        description: "Student has been successfully approved to write articles.",
      });

      setSelectedProfile(null);
      setPendingProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Approval failed";
      toast({
        title: "Approval Failed",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsActionPending(false);
    }
  };

  // Reject a student profile
  const handleReject = async (id: number) => {
    if (rejectionReason.trim().length < 10) return;
    setIsActionPending(true);
    try {
      await api.post(`/api/moderation/niat-profiles/${id}/reject/`, { 
        rejection_reason: rejectionReason.trim() 
      });
      
      toast({
        title: "Profile Rejected",
        description: "Student application was rejected successfully.",
      });

      setRejectionReason("");
      setSelectedProfile(null);
      setPendingProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Rejection failed";
      toast({
        title: "Rejection Failed",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsActionPending(false);
    }
  };

  // ================= VERIFIED ACTIONS =================
  const fetchVerifiedProfiles = useCallback(async (urlOrCursor?: string | null, isNavigating?: "next" | "prev") => {
    setIsVerifiedLoading(true);
    setVerifiedError(null);
    try {
      let requestUrl = "/api/moderation/verified-niat-profiles/";
      let params: any = {};

      if (urlOrCursor) {
        try {
          const urlObj = new URL(urlOrCursor);
          requestUrl = `${urlObj.pathname}${urlObj.search}`;
        } catch {
          requestUrl = urlOrCursor;
        }
      } else {
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        if (selectedCampus) {
          params.campus = selectedCampus;
        }
      }

      const res = await api.get(requestUrl, { params });
      const results = res.data.results ?? [];
      const count = res.data.total_count ?? res.data.count ?? 0;
      
      setVerifiedProfiles(results);
      setVerifiedCount(count);
      setNextCursor(res.data.next);
      setPrevCursor(res.data.previous);

      // Pagination index tracking
      if (!urlOrCursor) {
        setVerifiedStartIndex(1);
        setStartIndexHistory([1]);
      } else if (isNavigating === "next") {
        setVerifiedStartIndex((prevIndex) => {
          const nextIndex = prevIndex + results.length;
          setStartIndexHistory((prevHistory) => [...prevHistory, nextIndex]);
          return nextIndex;
        });
      } else if (isNavigating === "prev") {
        setStartIndexHistory((prevHistory) => {
          const newHistory = [...prevHistory];
          if (newHistory.length > 1) {
            newHistory.pop();
          }
          const prevIndex = newHistory[newHistory.length - 1] || 1;
          setVerifiedStartIndex(prevIndex);
          return newHistory;
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to load verified profiles";
      setVerifiedError(errMsg);
      toast({
        title: "Error Loading Verified Profiles",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsVerifiedLoading(false);
    }
  }, [debouncedSearch, selectedCampus, toast]);

  // Fetch verified profiles when tab loads, search runs, or campus changes
  useEffect(() => {
    if (activeTab === "verified") {
      fetchVerifiedProfiles();
    }
  }, [activeTab, debouncedSearch, selectedCampus, fetchVerifiedProfiles]);

  // Helpers for formatting UI
  const getInitials = (name: string) => {
    if (!name) return "?";
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = cleanName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatVerifiedDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, "0");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 lg:px-8 text-zinc-100 font-sans selection:bg-yellow-500/30 selection:text-white">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 text-yellow-500 border border-yellow-500/10 shadow-lg shadow-yellow-500/5">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Student Profiles
                {activeTab === "verified" && (
                  <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-500 border border-yellow-500/20">
                    {verifiedCount} Verified
                  </span>
                )}
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                {activeTab === "pending" 
                  ? "Review, verify credentials, and approve student authors" 
                  : "List of all verified NIAT student authors"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { 
              if (activeTab === "pending") fetchPendingProfiles(); 
              else fetchVerifiedProfiles(); 
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-850 hover:border-zinc-700 active:scale-95 transition-all text-xs font-semibold text-zinc-300 self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${((activeTab === "pending" && isPendingLoading) || (activeTab === "verified" && isVerifiedLoading)) ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-900 mb-8 gap-6 text-sm">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-4 font-semibold transition-all relative ${
              activeTab === "pending"
                ? "text-yellow-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Pending Moderation
            {activeTab === "pending" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("verified")}
            className={`pb-4 font-semibold transition-all relative ${
              activeTab === "verified"
                ? "text-yellow-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Verified Students
            {activeTab === "verified" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
            )}
          </button>
        </div>

        {/* ================= PENDING TAB VIEW ================= */}
        {activeTab === "pending" && (
          <>
            {isPendingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="h-32 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-900/30 flex items-center justify-between px-6"
                  >
                    <div className="flex items-center gap-4 w-2/3">
                      <div className="h-14 w-14 rounded-full bg-zinc-800/60" />
                      <div className="space-y-3 flex-1">
                        <div className="h-4 bg-zinc-800/60 rounded w-1/3" />
                        <div className="h-3 bg-zinc-800/40 rounded w-1/2" />
                        <div className="h-3 bg-zinc-800/30 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-10 w-24 bg-zinc-800/50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : pendingError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
                <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
                <h4 className="text-base font-semibold text-rose-400">Failed to Retrieve Profiles</h4>
                <p className="text-sm text-zinc-400 mt-1 max-w-md">{pendingError}</p>
                <button
                  onClick={() => fetchPendingProfiles()}
                  className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : pendingProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-850 p-16 text-center bg-zinc-900/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-zinc-500 mb-4 border border-zinc-800">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold text-zinc-300">No Pending Profiles</h4>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                  All student applications have been reviewed! Keep up the good work.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleViewDetail(profile.id)}
                    className="group flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/60 p-5 sm:flex-row sm:items-center sm:justify-between transition-all duration-300 cursor-pointer hover:border-zinc-800 shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {profile.profile_picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.profile_picture}
                            alt={profile.full_name}
                            className="h-14 w-14 rounded-full object-cover border border-zinc-850 bg-zinc-850 shadow-inner group-hover:border-zinc-700 transition-colors"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-zinc-850 text-zinc-500 group-hover:border-zinc-700 group-hover:text-zinc-400 transition-colors">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-yellow-500" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="text-base font-semibold text-white group-hover:text-yellow-500 transition-colors truncate">
                            {profile.full_name}
                          </h3>
                          <span className="text-xs text-zinc-500 font-mono">
                            #{profile.student_id_number}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-zinc-500" />
                            {profile.campus_name}
                          </span>
                          <span className="hidden md:flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-zinc-500" />
                            {profile.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            {new Date(profile.date_applied).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900 pt-3 sm:border-none sm:pt-0">
                      <div className="sm:hidden text-xs text-zinc-500">
                        Status: <span className="capitalize font-medium text-zinc-300">{profile.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-300 group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-all active:scale-95 shadow-sm"
                        >
                          Review
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================= VERIFIED TAB VIEW ================= */}
        {activeTab === "verified" && (
          <div className="space-y-6">
            
            {/* Stats Bar */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
              <span className="text-sm text-zinc-400 font-medium">Total Verified Students</span>
              <span className="text-xl font-bold text-white">{verifiedCount}</span>
            </div>

            {/* Filter Header Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-zinc-900/10 border border-zinc-900/60 p-4 rounded-2xl">
              {/* Debounced Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={verifiedSearch}
                  onChange={(e) => setVerifiedSearch(e.target.value)}
                  placeholder="Search by name, email, or student ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-yellow-500 focus:outline-none rounded-xl text-sm text-white placeholder:text-zinc-500 transition-colors"
                />
              </div>

              {/* Campus Filter Dropdown */}
              <div className="relative min-w-[200px]">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-yellow-500 focus:outline-none rounded-xl text-sm text-white appearance-none transition-colors cursor-pointer"
                >
                  <option value="">All Campuses</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-500">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Verified Student Table */}
            {isVerifiedLoading ? (
              <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl overflow-hidden shadow-xl animate-pulse">
                <div className="h-12 bg-zinc-900/40 border-b border-zinc-900" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 border-b border-zinc-900/60 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="h-9 w-9 rounded-full bg-zinc-800/60" />
                      <div className="h-4 bg-zinc-800/40 rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-zinc-800/30 rounded w-1/4" />
                    <div className="h-4 bg-zinc-800/30 rounded w-1/5" />
                  </div>
                ))}
              </div>
            ) : verifiedError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
                <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
                <h4 className="text-base font-semibold text-rose-400">Failed to Retrieve Verified Profiles</h4>
                <p className="text-sm text-zinc-400 mt-1 max-w-md">{verifiedError}</p>
                <button
                  onClick={() => fetchVerifiedProfiles()}
                  className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : verifiedProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-850 p-16 text-center bg-zinc-900/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-zinc-500 mb-4 border border-zinc-800">
                  <User className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold text-zinc-300">No verified students found</h4>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                  Try adjusting your search criteria or campus filters.
                </p>
              </div>
            ) : (
              <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <th className="py-4 px-6">Student</th>
                        <th className="py-4 px-6">Email</th>
                        <th className="py-4 px-6">Phone</th>
                        <th className="py-4 px-6">Campus</th>
                        <th className="py-4 px-6">Verified Date</th>
                        <th className="py-4 px-6 text-center">LinkedIn</th>
                        <th className="py-4 px-6 text-center">ID Card</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/40 text-sm">
                      {verifiedProfiles.map((student) => (
                        <tr key={student.id} className="hover:bg-zinc-900/30 transition-colors group">
                          {/* Student Details */}
                          <td className="py-3.5 px-6 flex items-center gap-3">
                            {student.profile_picture ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={student.profile_picture}
                                alt={student.full_name}
                                className="h-9 w-9 rounded-full object-cover border border-zinc-800 bg-zinc-850"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-850 border border-zinc-800 text-[10px] font-bold text-yellow-500 shadow-inner group-hover:border-zinc-700 transition-colors">
                                {getInitials(student.full_name)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white truncate max-w-[160px] group-hover:text-yellow-500 transition-colors">
                                {student.full_name}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {student.student_id_number}
                              </div>
                            </div>
                          </td>
                          
                          {/* Email */}
                          <td className="py-3.5 px-6 text-zinc-300">
                            <span className="truncate max-w-[150px] block">{student.email}</span>
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-6 text-zinc-300 font-mono text-xs">
                            {student.phone || "-"}
                          </td>

                          {/* Campus */}
                          <td className="py-3.5 px-6 text-zinc-300">
                            <span className="truncate max-w-[180px] block" title={student.campus_name}>
                              {student.campus_name}
                            </span>
                          </td>

                          {/* Verified Date */}
                          <td className="py-3.5 px-6 text-zinc-300 font-medium">
                            {formatVerifiedDate(student.verified_at)}
                          </td>

                          {/* LinkedIn link */}
                          <td className="py-3.5 px-6 text-center">
                            {student.linkedin_profile ? (
                              <a
                                href={student.linkedin_profile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-yellow-500 transition-all active:scale-95"
                                title="Open LinkedIn Profile"
                              >
                                <Linkedin className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-zinc-650">-</span>
                            )}
                          </td>

                          {/* ID Card link */}
                          <td className="py-3.5 px-6 text-center">
                            {student.id_card_file ? (
                              <a
                                href={student.id_card_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-yellow-500 transition-all active:scale-95"
                                title="Open ID Card"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-zinc-650">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cursor Pagination Bar */}
                <div className="bg-zinc-900/10 border-t border-zinc-900 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="text-xs text-zinc-500 font-medium">
                    Showing {verifiedStartIndex}–{Math.min(verifiedCount, verifiedStartIndex + verifiedProfiles.length - 1)} of {verifiedCount} verified students
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fetchVerifiedProfiles(prevCursor, "prev")}
                      disabled={!prevCursor || isVerifiedLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-750 text-xs font-semibold text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={() => fetchVerifiedProfiles(nextCursor, "next")}
                      disabled={!nextCursor || isVerifiedLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-750 text-xs font-semibold text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Drawer Overlay & Panel (Shared / Pending Tab Only) */}
      {selectedProfile && activeTab === "pending" && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay background */}
          <div 
            onClick={() => setSelectedProfile(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer content panel */}
          <div className="relative w-full max-w-2xl bg-zinc-900 border-l border-zinc-800/80 p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div>
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {selectedProfile.status}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">Application Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                  <p className="text-sm text-zinc-400">Loading student details...</p>
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm text-rose-400 font-medium">{detailError}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Profile Info */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start pb-6 border-b border-zinc-800/60">
                    {selectedProfile.profile_picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedProfile.profile_picture}
                        alt={selectedProfile.full_name}
                        className="h-20 w-20 rounded-2xl object-cover border border-zinc-800 bg-zinc-850"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-500">
                        <User className="h-10 w-10" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <h3 className="text-2xl font-bold text-white">{selectedProfile.full_name}</h3>
                      <p className="text-sm text-zinc-400 italic">
                        {selectedProfile.bio ? `"${selectedProfile.bio}"` : "No bio provided"}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Student ID Number</p>
                      <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold mt-1">
                        <IdCard className="h-4 w-4 text-zinc-500" />
                        {selectedProfile.student_id_number}
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Campus Name</p>
                      <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold mt-1">
                        <GraduationCap className="h-4 w-4 text-zinc-500" />
                        {selectedProfile.campus_name}
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Email Address</p>
                      <a href={`mailto:${selectedProfile.email}`} className="flex items-center gap-2 text-yellow-500 hover:underline text-sm font-semibold mt-1">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        {selectedProfile.email}
                      </a>
                    </div>

                    <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Phone Number</p>
                      <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold mt-1">
                        <Phone className="h-4 w-4 text-zinc-500" />
                        {selectedProfile.phone || "N/A"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">LinkedIn Profile</p>
                      {selectedProfile.linkedin_profile ? (
                        <a
                          href={selectedProfile.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-yellow-500 hover:underline text-sm font-semibold mt-1"
                        >
                          <Linkedin className="h-4 w-4 text-zinc-500" />
                          View Profile
                          <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                          <Linkedin className="h-4 w-4" />
                          Not provided
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Application Date</p>
                      <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold mt-1">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        {new Date(selectedProfile.date_applied).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* ID Card Verification */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">ID Card Document</h4>
                    {selectedProfile.id_card_file ? (
                      <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner group/card max-h-72 flex justify-center items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedProfile.id_card_file}
                          alt="Student ID Card"
                          className="object-contain max-h-72 w-full transition-transform duration-300 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={selectedProfile.id_card_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Original
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-850 bg-zinc-950/50 p-8 text-center text-zinc-500">
                        <IdCard className="h-8 w-8 mx-auto mb-2 text-zinc-650" />
                        No Student ID Card file was uploaded.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Moderation Actions Footer */}
            {!isDetailLoading && !detailError && selectedProfile && (
              <div className="mt-8 border-t border-zinc-800 pt-6">
                <div className="space-y-4">
                  {/* Rejection input box */}
                  <div className="space-y-2">
                    <label htmlFor="rejectionReason" className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
                      Rejection Reason <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="rejectionReason"
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide details about why the student profile is rejected (minimum 10 characters required to reject)..."
                      className="w-full text-sm bg-zinc-950 border border-zinc-850 focus:border-yellow-500 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none transition-colors resize-none"
                    />
                    <div className="flex justify-between text-[11px]">
                      <span className={rejectionReason.trim().length >= 10 ? "text-green-500 font-medium" : "text-zinc-650"}>
                        {rejectionReason.trim().length} / 10 characters minimum
                      </span>
                      <span className="text-zinc-600">* Required for rejection only</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {/* Reject Action Button */}
                    <button
                      type="button"
                      onClick={() => handleReject(selectedProfile.id)}
                      disabled={isActionPending || rejectionReason.trim().length < 10}
                      className="flex-1 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white disabled:bg-zinc-850 disabled:border-zinc-850 disabled:text-zinc-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isActionPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Reject Profile"
                      )}
                    </button>

                    {/* Approve Action Button */}
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedProfile.id)}
                      disabled={isActionPending}
                      className="flex-1 py-3 bg-green-500 text-black hover:bg-green-400 disabled:bg-zinc-850 disabled:text-zinc-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
                    >
                      {isActionPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Approve Profile"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
