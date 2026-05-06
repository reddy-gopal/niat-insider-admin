"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getModerators,
  assignModerator,
  updateModerator,
  removeModerator,
} from "@/lib/api/moderators";

export function useModerators(params?: {
  search?: string;
  is_active?: "true" | "false";
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ["moderators", params],
    queryFn: () => getModerators(params),
  });
}

export function useAssignModerator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignModerator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderators"] });
    },
  });
}

export function useUpdateModerator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateModerator(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderators"] });
    },
  });
}

export function useRemoveModerator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeModerator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderators"] });
    },
  });
}
