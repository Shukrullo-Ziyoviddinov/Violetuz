import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllActors, fetchActorById } from '../api/actorsApi';
import {
  fetchAllActorPageLabels,
  toActorPageSectionLabelsMap,
} from '../api/actorPageLabelsApi';

const ActorsApiContext = createContext(null);

export const ActorsApiProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const actorsQuery = useQuery({
    queryKey: ['actors'],
    queryFn: fetchAllActors,
    staleTime: 60_000,
    retry: 1,
  });
  const labelsQuery = useQuery({
    queryKey: ['actor-page-labels'],
    queryFn: fetchAllActorPageLabels,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const allActors = useMemo(
    () => (Array.isArray(actorsQuery.data) ? actorsQuery.data : []),
    [actorsQuery.data]
  );
  const actorPageLabels = useMemo(
    () => (Array.isArray(labelsQuery.data) ? labelsQuery.data : []),
    [labelsQuery.data]
  );
  const actorPageSectionLabels = useMemo(
    () => toActorPageSectionLabelsMap(actorPageLabels),
    [actorPageLabels]
  );

  const value = useMemo(
    () => ({
      allActors,
      actorPageLabels,
      actorPageSectionLabels,
      loading: actorsQuery.isLoading || labelsQuery.isLoading,
      error: actorsQuery.error?.message || labelsQuery.error?.message || null,
      getActorById: (id) =>
        allActors.find((a) => String(a.id) === String(id)) || null,
      getActorsByIds: (ids = []) => {
        const normalized = new Set(
          (Array.isArray(ids) ? ids : []).map((id) => String(id))
        );
        return allActors.filter((a) => normalized.has(String(a.id)));
      },
      getActorsByGenre: (actorsGenre) => {
        if (actorsGenre == null || actorsGenre === '') return [];
        const g = String(actorsGenre).toLowerCase();
        return allActors.filter(
          (a) => String(a.actorsGenre || '').toLowerCase() === g
        );
      },
      refreshActors: async () =>
        queryClient.fetchQuery({
          queryKey: ['actors'],
          queryFn: fetchAllActors,
        }),
      refreshActorPageLabels: async () =>
        queryClient.fetchQuery({
          queryKey: ['actor-page-labels'],
          queryFn: fetchAllActorPageLabels,
        }),
      fetchActorByIdRemote: fetchActorById,
    }),
    [
      allActors,
      actorPageLabels,
      actorPageSectionLabels,
      actorsQuery.isLoading,
      labelsQuery.isLoading,
      actorsQuery.error,
      labelsQuery.error,
      queryClient,
    ]
  );

  return (
    <ActorsApiContext.Provider value={value}>{children}</ActorsApiContext.Provider>
  );
};

export const useActorsApi = () => {
  const ctx = useContext(ActorsApiContext);
  if (!ctx) {
    throw new Error('useActorsApi must be used within ActorsApiProvider');
  }
  return ctx;
};

export default ActorsApiContext;
