import { useEffect } from 'react';
import { create } from 'zustand';
import api from '../utils/api';
import { useAuthStore, useStoreManagement } from './useStore';
import { normalizePerms } from '../utils/permissions';

// What the logged-in person may do in the current store.
// Owners: everything. Staff: the permissions their store admin gave them —
// fetched fresh from the server for the selected store (a staff member can
// have different permissions per store, and changes apply without logging
// out). Until that answer arrives, the permissions from login are used.
const useLiveAccess = create((set) => ({
  byStore: {},
  setFor: (storeId, perms) => set((s) => ({ byStore: { ...s.byStore, [storeId]: perms } })),
}));

const inflight = {};
export function refreshStaffAccess(storeId) {
  if (!storeId || inflight[storeId]) return;
  inflight[storeId] = api.get(`/owner/stores/${storeId}/my-access`)
    .then(({ data }) => { if (data?.is_staff) useLiveAccess.getState().setFor(storeId, data.permissions || []); })
    .catch(() => {})
    .finally(() => { setTimeout(() => { delete inflight[storeId]; }, 15000); });
}

export default function useStaffAccess() {
  const user = useAuthStore((s) => s.user);
  const storeId = useStoreManagement((s) => s.currentStore?.id);
  const live = useLiveAccess((s) => (storeId ? s.byStore[storeId] : undefined));
  const isStaff = !!user?.is_staff;
  useEffect(() => { if (isStaff && storeId) refreshStaffAccess(storeId); }, [isStaff, storeId]);
  const perms = isStaff ? normalizePerms(live ?? user?.permissions) : null;
  const can = (key) => !perms || perms.has(key);
  const canAny = (...keys) => !perms || keys.flat().some((k) => perms.has(k));
  return { isStaff, perms, can, canAny };
}
