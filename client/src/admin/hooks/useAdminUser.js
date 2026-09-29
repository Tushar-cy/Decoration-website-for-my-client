import { useOutletContext } from "react-router-dom";

/**
 * Returns the currentUser object from the AdminLayout outlet context.
 * All admin pages rendered under <AdminLayout> should use this hook
 * to access role-aware information.
 *
 * @returns {{ currentUser: { _id: string, name: string, email: string, role: "owner"|"staff" } | null }}
 */
export function useAdminUser() {
  const ctx = useOutletContext();
  return { currentUser: ctx?.currentUser ?? null };
}
