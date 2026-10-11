/**
 * User management API.
 * Wraps /core/auth/users/ (admin) and /core/auth/me/ (self).
 */

import { request, toQuery } from "./http";

export const userApi = {
  // ---------------------------------------------------------------- admin
  list: (filters = {}) =>
    request(`/auth/users/${toQuery(filters)}`),

  get: (id) => request(`/auth/users/${id}/`),

  create: (data) =>
    request(`/auth/users/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/auth/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /** Soft delete — flips is_active to False server-side. */
  deactivate: (id) =>
    request(`/auth/users/${id}/`, { method: "DELETE" }),

  setPassword: (id, newPassword) =>
    request(`/auth/users/${id}/set-password/`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    }),

  toggleActive: (id) =>
    request(`/auth/users/${id}/toggle-active/`, { method: "POST" }),

  // ---------------------------------------------------------------- self
  me: () => request(`/auth/me/`),

  updateMe: (data) =>
    request(`/auth/me/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changeMyPassword: (oldPassword, newPassword) =>
    request(`/auth/change-password/`, {
      method: "POST",
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    }),

  // ---------------------------------------------------------------- helpers
  lookupParentByPhone: (phone) =>
    request(`/auth/parents/lookup/${toQuery({ phone })}`),
  listStaff: (filters = {}) =>
  request(`/auth/users/${toQuery({ ...filters, role: "staff" })}`),

listParents: (filters = {}) =>
  request(`/auth/users/${toQuery({ ...filters, role: "parent" })}`),

syncParentChildren: (parentId, children) =>
  request(`/auth/users/${parentId}/children/`, {
    method: "POST",
    body: JSON.stringify({ children }),
  }),

/** Linked children for a parent. Add a backend action for this (see §5). */
getParentChildren: (parentId) =>
  request(`/auth/users/${parentId}/children/`),
};

// Label + colour maps used across the UI
export const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "headteacher", label: "Head Teacher" },
  { value: "deputy", label: "Deputy Principal" },
  { value: "hod", label: "Head of Department" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "teacher", label: "Teacher" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
  { value: "parent", label: "Parent" },
];


export const DESIGNATIONS = [
  { value: "Principal", label: "Principal" },
  { value: "Deputy Principal", label: "Deputy Principal" },
  { value: "Head of Department", label: "Head of Department" },
  { value: "Section Head", label: "Section Head" },
  { value: "Class Teacher", label: "Class Teacher" },
  { value: "Subject Teacher", label: "Subject Teacher" },
  { value: "Librarian", label: "Librarian" },
  { value: "Sports Master/Mistress", label: "Sports Master/Mistress" },
  { value: "Games Teacher", label: "Games Teacher" },
  { value: "Music Teacher", label: "Music Teacher" },
  { value: "Counsellor", label: "Counsellor" },
  { value: "Bursar", label: "Bursar" },
  { value: "Accountant", label: "Accountant" },
  { value: "Secretary", label: "Secretary" },
  { value: "School Nurse", label: "School Nurse" },
  { value: "Matron", label: "Matron" },
  { value: "Groundsman", label: "Groundsman" },
  { value: "Security", label: "Security" },
  { value: "Driver", label: "Driver" },
  { value: "Cook", label: "Cook" },
  { value: "Cleaner", label: "Cleaner" },
  { value: "Other", label: "Other" },
];



export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

export const ROLE_COLOR = {
  admin: "error",
  headteacher: "error",
  deputy: "warning",
  hod: "warning",
  class_teacher: "primary",
  teacher: "primary",
  accountant: "info",
  staff: "default",
  parent: "success",
};
