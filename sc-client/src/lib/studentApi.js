import { request, toFormData, toQuery } from "./http";

/**
 * Student API.
 *
 * The backend `StudentSerializer`:
 *   - auto-generates `id` if missing
 *   - derives `gradeLevel` from the chosen class
 *   - auto-creates an active Enrollment on admission
 *   - defaults `admission_date` to today if blank
 *
 * So the frontend should NOT generate an id itself, and should NOT worry
 * about grade_level — send classId and let the server fill the rest.
 */

function normalizeStudentPayload(data) {
  const payload = { ...data };

  // Frontend historically named these `parents`; backend expects `parents_data`.
  if (payload.parents) {
    payload.parents_data = payload.parents;
    delete payload.parents;
  }

  // Never send a data-URL photo string — only a real File.
  if (typeof payload.photo === "string") {
    delete payload.photo;
  }

  return payload;
}

export const studentApi = {
  // ---- list / read ------------------------------------------------------
  getStudents: (params = {}) => {
    const p = { ...params };
    if (p.classId) {
      p.class_room = p.classId;
      delete p.classId;
    }
    if (p.status === "all") delete p.status;
    return request(`/students/${toQuery(p)}`).catch(() => []);
  },

  getStudent: (id) => request(`/students/${id}/`),
  getStudentsByClass: (classId) => request(`/students/${toQuery({ class_room: classId })}`),

  // ---- create / update / delete ----------------------------------------
  createStudent: (data) => {
    const payload = normalizeStudentPayload(data);

    if (payload.photo instanceof File) {
      return request("/students/", { method: "POST", body: toFormData(payload) });
    }
    return request("/students/", { method: "POST", body: JSON.stringify(payload) });
  },

  updateStudent: (id, data) => {
    const payload = normalizeStudentPayload(data);

    if (payload.photo instanceof File) {
      return request(`/students/${id}/`, { method: "PATCH", body: toFormData(payload) });
    }
    return request(`/students/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
  },

  deleteStudent: (id) => request(`/students/${id}/`, { method: "DELETE" }),

  updateStudentAvatar: (id, photoUrl) =>
    request(`/students/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ photo: photoUrl }),
    }),

  // ---- enrollments (read-only here; writes go through enrollmentApi) ----
  getStudentEnrollments: (studentId) =>
    request(`/academics/enrollments/${toQuery({ student: studentId })}`).catch(() => []),

  // ---- parent lookup ----------------------------------------------------
  findParentByPhone: async (phone) => {
    try {
      const res = await request(`/auth/parents/lookup/${toQuery({ phone })}`);
      return res ?? null;
    } catch {
      return null;
    }
  },
};
