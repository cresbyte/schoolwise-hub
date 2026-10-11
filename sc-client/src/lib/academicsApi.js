/**
 * Academics module API integration for SchoolWise Hub.
 * Handles: ClassRooms, Subjects, SubjectAssignments, TimetableSlots.
 *
 * All endpoints are under /academics/ (mounted from academics/urls.py).
 */
import { request, toQuery } from "./http";

// ============================================================
// Academics API
// ============================================================

export const academicsApi = {
  // ============================================================
  // ClassRooms
  // ============================================================
  getClasses: (filters) =>
    request(`/academics/classes/${toQuery(filters)}`).catch(() => []),
  getClass: (id) => request(`/academics/classes/${id}/`),
  createClass: (data) =>
    request("/academics/classes/", { method: "POST", body: JSON.stringify(data) }),
  updateClass: (id, data) =>
    request(`/academics/classes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteClass: (id) =>
    request(`/academics/classes/${id}/`, { method: "DELETE" }),
  getClassRoster: (id) => request(`/academics/classes/${id}/roster/`),


  // ============================================================
  // Subjects
  // ============================================================
  getSubjects: (filters) =>
    request(`/academics/subjects/${toQuery(filters)}`).catch(() => []),
  getSubject: (id) => request(`/academics/subjects/${id}/`),
  createSubject: (data) =>
    request("/academics/subjects/", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id, data) =>
    request(`/academics/subjects/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSubject: (id) =>
    request(`/academics/subjects/${id}/`, { method: "DELETE" }),

  // ============================================================
  // Subject Assignments (teacher ↔ subject ↔ class)
  // ============================================================
  getAssignments: (filters) =>
    request(`/academics/assignments/${toQuery(filters)}`).catch(() => []),
  createAssignment: (data) =>
    request("/academics/assignments/", { method: "POST", body: JSON.stringify(data) }),
  updateAssignment: (id, data) =>
    request(`/academics/assignments/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAssignment: (id) =>
    request(`/academics/assignments/${id}/`, { method: "DELETE" }),

  /**
   * Upsert: find existing assignment for (class, subject) and update its teacher,
   * or create a new one. The backend enforces one teacher per (subject, class).
   */
  assignTeacher: async (classId, subjectId, teacherId, periodsPerWeek = 5) => {
    const existing = await request(
      `/academics/assignments/${toQuery({ class_room: classId, subject: subjectId })}`
    ).catch(() => []);
    const list = Array.isArray(existing) ? existing : [];
    if (list.length > 0) {
      return request(`/academics/assignments/${list[0].id}/`, {
        method: "PATCH",
        body: JSON.stringify({ teacherId, periodsPerWeek }),
      });
    }
    return request("/academics/assignments/", {
      method: "POST",
      body: JSON.stringify({ classId, subjectId, teacherId, periodsPerWeek }),
    });
  },

  /** All assignments for a class, used to build the subject-teacher grid. */
  getClassAssignments: (classId) =>
    request(`/academics/assignments/${toQuery({ class_room: classId })}`).catch(() => []),

  /** All assignments for a teacher, used on their profile / load view. */
  getTeacherLoad: (teacherId) =>
    request(`/academics/assignments/${toQuery({ teacher: teacherId })}`)
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        const totalPeriods = list.reduce((s, a) => s + (a.periodsPerWeek ?? 0), 0);
        return { assignments: list, totalPeriods };
      })
      .catch(() => ({ assignments: [], totalPeriods: 0 })),

  // ============================================================
  // Timetable
  // ============================================================
  getTimetable: (filters) =>
    request(`/academics/timetable/${toQuery(filters)}`).catch(() => []),
  getClassTimetable: (classId) =>
    request(`/academics/timetable/${toQuery({ class_room: classId })}`).catch(() => []),
  getTeacherTimetable: (teacherId) =>
    request(`/academics/timetable/${toQuery({ teacher: teacherId })}`).catch(() => []),
  createSlot: (data) =>
    request("/academics/timetable/", { method: "POST", body: JSON.stringify(data) }),
  updateSlot: (id, data) =>
    request(`/academics/timetable/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSlot: (id) =>
    request(`/academics/timetable/${id}/`, { method: "DELETE" }),
  getTeachers: () =>
  request(`/staff/${toQuery({ role__in: "teacher,class_teacher,headteacher,deputy,hod" })}`)
    .catch(() => []),
    // ============================================================
  // Bell schedules (the shape of the school day, per grade group)
  // ============================================================
  getBellSchedules: () =>
    request("/academics/bell-schedules/").catch(() => []),
  createBellSchedule: (data) =>
    request("/academics/bell-schedules/", { method: "POST", body: JSON.stringify(data) }),
  updateBellSchedule: (id, data) =>
    request(`/academics/bell-schedules/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBellSchedule: (id) =>
    request(`/academics/bell-schedules/${id}/`, { method: "DELETE" }),

  // In the Timetable section:
  getClassBell: (classId) =>
    request(`/academics/timetable/bell/${toQuery({ class_room: classId })}`).catch(() => []),

  /** Replace the entire week for one class in a single transaction. */
  saveTimetable: (classId, slots) =>
    request("/academics/timetable/bulk-save/", {
      method: "POST",
      body: JSON.stringify({ classId, slots }),
    }),

  /** Round-robin fill from SubjectAssignment rows. */
  generateTimetable: (classId, includeSaturday = false) =>
    request("/academics/timetable/generate/", {
      method: "POST",
      body: JSON.stringify({ classId, includeSaturday }),
    }),
};

// ============================================================
// Label maps
// ============================================================

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const LEARNING_AREAS = [
  { value: "languages", label: "Languages" },
  { value: "mathematics", label: "Mathematics" },
  { value: "sciences", label: "Sciences" },
  { value: "social_sciences", label: "Social Sciences" },
  { value: "technical", label: "Technical & Applied" },
  { value: "creative", label: "Creative Arts & Sports" },
  { value: "religious", label: "Religious Education" },
  { value: "life_skills", label: "Life Skills" },
  { value: "other", label: "Other" },
];

export const CBC_GRADES = [
  "PP1", "PP2",
  "Grade 1", "Grade 2", "Grade 3",
  "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9",
  "Grade 10", "Grade 11", "Grade 12",
];
