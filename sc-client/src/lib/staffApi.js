import { request, toQuery } from "./http";
import { academicsApi } from "./academicsApi";
import { examsApi } from "./examsApi";
import { schoolApi } from "./schoolApi";
import { api } from "./api";
import * as mockApi from "./mockApi";

/**
 * Staff and Teacher Portal API integration.
 * Provides unified helper methods for classes, schedules, leaves, grading, and notices.
 */

export const ANNUAL_LEAVE_ENTITLEMENT = 30;

export const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
  { value: "study", label: "Study Leave" },
];

export const staffApi = {
  /**
   * Get staff member profile details
   */
  getProfile: (staffId) =>
    request(`/staff/${staffId}/`).catch(() => request("/auth/me/")),

  /**
   * Get all classes assigned to a teacher (as class teacher or subject teacher)
   */
  getMyClasses: async (teacherId, role = "teacher") => {
    try {
      const [allClasses, assignments] = await Promise.all([
        academicsApi.getClasses({ current: 1 }).catch(() => academicsApi.getClasses()),
        teacherId ? academicsApi.getAssignments({ teacher: teacherId }).catch(() => []) : [],
      ]);

      const classes = Array.isArray(allClasses) ? allClasses : [];
      const assignList = Array.isArray(assignments) ? assignments : [];

      // If user is admin/headteacher, they have access to all classes
      if (["admin", "headteacher", "deputy"].includes(role)) {
        return classes.map((c) => ({
          ...c,
          isClassTeacher: c.classTeacherId === teacherId || c.classTeacher === teacherId,
          assignedSubjects: assignList.filter((a) => a.classRoom === c.id || a.classId === c.id),
        }));
      }

      // Filter classes where teacher is either class teacher OR assigned a subject
      const assignedClassIds = new Set(
        assignList.map((a) => a.classRoom || a.classId).filter(Boolean)
      );

      const myClasses = classes.filter(
        (c) =>
          c.classTeacherId === teacherId ||
          c.classTeacher === teacherId ||
          assignedClassIds.has(c.id)
      );

      // If no explicit assignment found, return all classes so teacher is not blocked
      const resultClasses = myClasses.length > 0 ? myClasses : classes;

      // Enrich classes with actual enrolled student counts
      const enrichedClasses = await Promise.all(
        resultClasses.map(async (c) => {
          let count = c.studentCount ?? c.student_count ?? c.enrolledCount ?? c.enrolled_count;
          if (count === undefined || count === null || count === 0) {
            try {
              let students = await api.getStudentsByClass(c.id).catch(() => null);
              if (!students || !Array.isArray(students)) {
                students = await academicsApi.getClassRoster(c.id).catch(() => null);
              }
              if (Array.isArray(students)) {
                count = students.length;
              } else if (students?.results && Array.isArray(students.results)) {
                count = students.count ?? students.results.length;
              }
            } catch {
              count = 0;
            }
          }
          return {
            ...c,
            studentCount: Number(count) || 0,
            isClassTeacher: c.classTeacherId === teacherId || c.classTeacher === teacherId,
            assignedSubjects: assignList.filter((a) => a.classRoom === c.id || a.classId === c.id),
          };
        })
      );

      return enrichedClasses;
    } catch {
      return [];
    }
  },

  /**
   * Get teacher's weekly timetable slots
   */
  getMyTimetable: async (teacherId) => {
    if (!teacherId) return [];
    try {
      const slots = await academicsApi.getTeacherTimetable(teacherId);
      return Array.isArray(slots) ? slots : [];
    } catch {
      return [];
    }
  },

  /**
   * Get teacher's open grading tasks and exams
   */
  getMyGrading: async () => {
    try {
      const grading = await examsApi.getMyGrading();
      return Array.isArray(grading) ? grading : [];
    } catch {
      return [];
    }
  },

  /**
   * Get notices & announcements relevant to staff
   */
  getNotices: async (filters = {}) => {
    try {
      const [events, messages] = await Promise.all([
        schoolApi.getCalendarEvents(filters).catch(() => []),
        request(`/messaging/school-messages/${toQuery(filters)}`).catch(() => []),
      ]);

      const list = [];

      if (Array.isArray(events)) {
        events.forEach((ev) => {
          list.push({
            id: `ev-${ev.id}`,
            title: ev.title,
            category: ev.category || "Event",
            date: ev.start_date || ev.startDate || ev.date,
            priority: ev.category === "exam" ? "urgent" : "normal",
            author: ev.creator_name || "Administration",
            content: ev.description || ev.content || "School calendar event.",
            type: "calendar",
          });
        });
      }

      if (Array.isArray(messages)) {
        messages.forEach((msg) => {
          list.push({
            id: `msg-${msg.id}`,
            title: msg.subject || msg.title || "Announcement",
            category: "Announcement",
            date: msg.created_at ? msg.created_at.split("T")[0] : "Recent",
            priority: msg.priority || "normal",
            author: msg.sender_name || "School Office",
            content: msg.body || msg.content || "",
            type: "message",
          });
        });
      }

      return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    } catch {
      return [];
    }
  },

  /**
   * Get staff leave requests
   */
  getLeaveRequests: async (filters = {}) => {
    try {
      const res = await request(`/staff/leaves/${toQuery(filters)}`);
      return Array.isArray(res) ? res : [];
    } catch {
      // Fallback to mock API / storage
      try {
        const mockLeaves = await mockApi.getLeaveRequests(filters);
        return Array.isArray(mockLeaves) ? mockLeaves : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Apply for leave
   */
  applyLeave: async (payload) => {
    try {
      return await request("/staff/leaves/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      // Fallback to mock API / local creation
      return await mockApi.createLeaveRequest(payload);
    }
  },
};
