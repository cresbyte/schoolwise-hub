/**
 * Real API integration for SchoolWise Hub.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://primapi.cresbyte.com/api";

// ============================================================
// Helpers
// ============================================================

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: any = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || "Request failed");
  }
  const data = await response.json();
  return data.results || data;
}

function toQuery(params: Record<string, any> = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  const q = new URLSearchParams(clean).toString();
  return q ? `?${q}` : "";
}

/** Builds a FormData body, JSON-encoding nested objects and keeping Blobs/Files as-is. */
function toFormData(payload: Record<string, any>) {
  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      if (v instanceof Blob) {
        formData.append(k, v);
      } else if (typeof v === "object") {
        formData.append(k, JSON.stringify(v));
      } else {
        formData.append(k, String(v));
      }
    }
  });
  return formData;
}

export const api = {
  // ============================================================
  // Auth
  // ============================================================
  me: () => request("/auth/me/"),
  updateProfile: (data: any) =>
    request("/auth/me/", { method: "PATCH", body: JSON.stringify(data) }),
  updateAvatar: (formData: FormData) =>
    fetch(`${BASE_URL}/auth/me/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      body: formData,
    }).then((res) => res.json()),

  /**
   * Look up a user by their phone number (local format: 07XXXXXXXX or 01XXXXXXXX).
   * Uses the dedicated /auth/parents/lookup/ endpoint which does an exact phone match
   * and returns { id, name, email, role, children } or null if not found.
   */
  findParentByPhone: async (phone: string) => {
    try {
      const res = await request(`/auth/parents/lookup/?phone=${encodeURIComponent(phone)}`);
      return res ?? null;
    } catch {
      return null;
    }
  },

  // ============================================================
  // School profile & settings
  // ============================================================
  getSchool: () => request("/school/profile/").catch(() => null),
  getSchoolSettings: () => request("/school/profile/").catch(() => null),
  updateSchoolSettings: (data: any) =>
    request("/school/profile/", { method: "PATCH", body: JSON.stringify(data) }),
  getIntegrationsStatus: () =>
    request("/school/integrations-status/").catch(() => ({
      emailConfigured: false,
      mpesaConfigured: false,
      smsConfigured: false,
    })),

  // ============================================================
  // Staff
  // ============================================================
  getStaff: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/staff/${query}`);
  },
  getStaffById: (id: string) => request(`/staff/${id}/`),
  createStaff: (data: any) => request("/staff/", { method: "POST", body: JSON.stringify(data) }),
  resetStaffPassword: (id: string) => request(`/staff/${id}/reset-password/`, { method: "POST" }),

  
  // ============================================================
  // Students
  // ============================================================
  getStudents: (params?: any) => {
    const p = { ...params };
    if (p.classId) {
      p.class_room = p.classId;
      delete p.classId;
    }
    if (p.boardingStatus) {
      if (p.boardingStatus !== "all") p.boarding_status = p.boardingStatus;
      delete p.boardingStatus;
    }
    if (p.status === "all") delete p.status;
    const query = new URLSearchParams(p).toString();
    return request(`/students/${query ? "?" + query : ""}`);
  },
  getStudent: (id: string) => request(`/students/${id}/`),
  getStudentsByClass: (classId: string) => request(`/students/?class_room=${classId}`),

  createStudent: (data: any) => {
    const payload = { ...data };

    // Auto-generate ID and admission number if missing
    if (!payload.id) payload.id = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (!payload.admissionNumber)
      payload.admissionNumber = `ADM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // Rename parents to parents_data for the backend
    if (payload.parents) {
      payload.parents_data = payload.parents;
      delete payload.parents;
    }

    if (typeof payload.photo === "string") {
      delete payload.photo;
    }

    if (payload.photo instanceof File) {
      return request("/students/", { method: "POST", body: toFormData(payload) });
    }

    return request("/students/", { method: "POST", body: JSON.stringify(payload) });
  },

  updateStudent: (id: string, data: any) => {
    const payload = { ...data };

    // Rename parents to parents_data for the backend
    if (payload.parents) {
      payload.parents_data = payload.parents;
      delete payload.parents;
    }

    if (typeof payload.photo === "string") {
      delete payload.photo;
    }

    if (payload.photo instanceof File) {
      return request(`/students/${id}/`, { method: "PATCH", body: toFormData(payload) });
    }

    return request(`/students/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  deleteStudent: (id: string) => request(`/students/${id}/`, { method: "DELETE" }),
  updateStudentAvatar: (id: string, photoUrl: string) =>
    request(`/students/${id}/`, { method: "PATCH", body: JSON.stringify({ photo: photoUrl }) }),

  // ============================================================
  // Admissions
  // ============================================================
  /**
   * Public submission from the website apply form. Deliberately bypasses the
   * shared request() helper: that helper always attaches whatever token is
   * sitting in localStorage, and a stale/expired one causes SimpleJWT to
   * reject the request with 401 *before* the backend's AllowAny permission
   * is ever checked. This endpoint must work for anonymous site visitors
   * regardless of what's left over in the browser from a previous session.
   */
  submitApplication: async (data: any) => {
    const response = await fetch(`${BASE_URL}/applications/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Submission failed" }));
      throw new Error(error.detail || "Submission failed");
    }
    return response.json();
  },
  getApplications: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return request(`/applications/${query}`).catch(() => []);
  },
  getApplication: (id: string | number) => request(`/applications/${id}/`),
  updateApplication: (id: string | number, data: any) =>
    request(`/applications/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  /** Non-terminal transitions: interview_scheduled | offered | rejected | withdrawn. */
  updateApplicationStatus: (id: string | number, statusValue: string, extra?: any) =>
    request(`/applications/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status: statusValue, ...extra }),
    }),
  /** Converts an offered application into a real Student + parent account. */
  convertApplication: (id: string | number, classId: string) =>
    request(`/applications/${id}/convert/`, {
      method: "POST",
      body: JSON.stringify({ classId }),
    }),

  // ============================================================
  // Academics - Classes
  // ============================================================
  getClasses: () => request("/academics/classes/"),
  getGrades: () => request("/academics/classes/"),
  getClass: (id: string) => request(`/academics/classes/${id}/`),
  getClassById: (id: string) => request(`/academics/classes/${id}/`),
  createClass: (data: any) =>
    request("/academics/classes/", { method: "POST", body: JSON.stringify(data) }),
  updateClass: (id: string, data: any) =>
    request(`/academics/classes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // ============================================================
  // Academics - Subjects
  // ============================================================
  getSubjects: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/subjects/${query}`);
  },
  getSubjectById: (id: string) => request(`/academics/subjects/${id}/`),
  createSubject: (data: any) =>
    request("/academics/subjects/", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id: string, data: any) =>
    request(`/academics/subjects/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // ============================================================
  // Academics - Assignments / ClassSubjects
  // ============================================================
  getClassSubjects: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/assignments/${query}`);
  },
  createClassSubject: (data: any) =>
    request("/academics/assignments/", { method: "POST", body: JSON.stringify(data) }),
  updateClassSubject: (id: string, patch: any) =>
    request(`/academics/assignments/${id}/`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteClassSubject: (id: string) =>
    request(`/academics/assignments/${id}/`, { method: "DELETE" }),
  getTeacherLoad: (staffId: string) =>
    request(`/academics/assignments/?teacherId=${staffId}`).then((res) => {
      const list = Array.isArray(res) ? res : [];
      const totalPeriods = list.reduce((s: number, cs: any) => s + (cs.periodsPerWeek ?? 5), 0);
      return { classSubjects: list, totalPeriods };
    }),
  assignTeacherToSubject: (classId: string, subjectId: string, teacherId: string) => {
    return request(`/academics/assignments/?classId=${classId}&subjectId=${subjectId}`).then(
      (res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) {
          return request(`/academics/assignments/${list[0].id}/`, {
            method: "PATCH",
            body: JSON.stringify({ teacherId }),
          });
        } else {
          return request("/academics/assignments/", {
            method: "POST",
            body: JSON.stringify({ classId, subjectId, teacherId }),
          });
        }
      },
    );
  },

  // ============================================================
  // Academics - Timetable
  // ============================================================
  getTimetable: (classId: string) => request(`/academics/timetable/?classId=${classId}`),
  getTeacherTimetable: (staffId: string) => request(`/academics/timetable/?teacherId=${staffId}`),
  saveTimetable: (classId: string, slots: any[]) =>
    request("/academics/timetable/bulk_save/", {
      method: "POST",
      body: JSON.stringify({ classId, slots }),
    }),
  generateAutoTimetable: (classId: string) =>
    request("/academics/timetable/generate_auto/", {
      method: "POST",
      body: JSON.stringify({ classId }),
    }),

  // ============================================================
  // Academics - Terms & Academic Year
  // ============================================================
  getAcademicTerms: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/terms/${query}`).catch(() => []);
  },
  getAcademicTerm: (id: string | number) => request(`/academics/terms/${id}/`),
  createAcademicTerm: (data: any) =>
    request("/academics/terms/", { method: "POST", body: JSON.stringify(data) }),
  updateAcademicTerm: (id: string | number, data: any) =>
    request(`/academics/terms/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAcademicTerm: (id: string | number) =>
    request(`/academics/terms/${id}/`, { method: "DELETE" }),
  setupAcademicYear: (year: number, terms: any[]) =>
    request("/academics/terms/setup-year/", {
      method: "POST",
      body: JSON.stringify({ year, terms }),
    }),

  // ============================================================
  // Academics - Term Planner (events)
  // ============================================================
  getTermEvents: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/term-events/${query}`).catch(() => []);
  },
  createTermEvent: (data: any) =>
    request("/academics/term-events/", { method: "POST", body: JSON.stringify(data) }),
  updateTermEvent: (id: string | number, data: any) =>
    request(`/academics/term-events/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTermEvent: (id: string | number) =>
    request(`/academics/term-events/${id}/`, { method: "DELETE" }),
  approveTermEvent: (id: string | number, _reviewerId?: string, _reviewerName?: string) =>
    request(`/academics/term-events/${id}/approve/`, { method: "POST" }),
  rejectTermEvent: (
    id: string | number,
    _reviewerId?: string,
    _reviewerName?: string,
    reason?: string,
  ) =>
    request(`/academics/term-events/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    }),

  // ============================================================
  // Academics - Performance reports
  // ============================================================
  getClassPerformanceReport: (classId: string, examId: string) =>
    request(`/academics/performance/?class_room=${classId}&exam=${examId}`).catch(() => ({
      subjectStats: [],
    })),
  getSchoolPerformanceTrend: () => request("/academics/performance/trend/").catch(() => []),
  getKNEC7Best: (classId: string, examId: string) =>
    request(`/academics/exams/knec7/?class_room=${classId}&exam=${examId}`).catch(() => []),

  // ============================================================
  // Attendance
  // ============================================================
  /** Fetch attendance records for a class within an inclusive date range. */
  getAttendance: (classId: string, dateFrom: string, dateTo: string) =>
    request(`/attendance/?class_room=${classId}&date_from=${dateFrom}&date_to=${dateTo}`).catch(
      () => [],
    ),

  /** Per-day attendance counts for a class in a date range. */
  getAttendanceSummary: (classId: string, dateFrom: string, dateTo: string) =>
    request(
      `/attendance/summary/?class_room=${classId}&date_from=${dateFrom}&date_to=${dateTo}`,
    ).catch(() => []),

  /** Idempotent bulk upsert — create or update attendance for a full week. */
  saveAttendanceBulk: (records: any[]) =>
    request("/attendance/bulk_save/", { method: "POST", body: JSON.stringify(records) }),

  /** Attendance records for a single student in a date range. */
  getStudentAttendance: (studentId: string, start: string, end: string) =>
    request(`/attendance/?student=${studentId}&date_from=${start}&date_to=${end}`)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        return list.map((r: any) => ({ ...r, reason: r.remarks || r.reason || "" }));
      })
      .catch(() => []),

  // ============================================================
  // Finance - Overview & Payroll
  // ============================================================
  getFeeCollectionSummary: () =>
    request("/fees/summary/").catch(() => ({
      collectionRate: 0,
      totalInvoiced: 0,
      totalCollected: 0,
    })),
  getPayroll: (month: number, year: number) =>
    request(`/payroll/?month=${month}&year=${year}`).catch(() => []),

  // ============================================================
  // Fees - Invoices & Payments
  // ============================================================
  getStudentInvoice: (studentId: string) =>
    request(`/fees/invoices/current/?student=${studentId}`).catch(() => ({
      items: [],
      balance: 0,
    })),

  getPayments: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return request(`/fees/payments/?${query}`).catch(() => []);
  },
  getInvoices: (params: any = {}) => {
    // 1. Filter out undefined, null, or empty string values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ""),
    );

    // 2. Build query string only with valid values
    const query = new URLSearchParams(cleanParams).toString();
    return request(`/fees/invoices/${query ? `?${query}` : ""}`);
  },
  recordPayment: (data: any) =>
    request("/fees/payments/", { method: "POST", body: JSON.stringify(data) }),
  generateTermInvoices: (year, term, dueDate) =>
    request("/fees/invoices/generate_for_term/", {
      method: "POST",
      body: JSON.stringify({ year, term, due_date: dueDate }),
    }),

  // ============================================================
  // Fees - Structures & History
  // ============================================================
  getFeeStructures: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/fees/structures/${query}`).catch(() => []);
  },
  getFeeStructure: (year: number) => request(`/fees/structures/?year=${year}`),
  createFeeStructure: (data: { year: number; copyFromYear?: number | null }) =>
    request("/fees/structures/", { method: "POST", body: JSON.stringify(data) }),
  updateFeeStructure: (year: number, data: { changes: any[]; reason: string; status?: string }) =>
    request(`/fees/structures/${year}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  refreshFeeStructure: (year: number) =>
    request("/fees/structures/refresh/", {
      method: "POST",
      body: JSON.stringify({ year }),
    }),
  reviseFeeStructure: (id: string | number, data: any) =>
    request(`/fees/structures/${id}/revise/`, { method: "POST", body: JSON.stringify(data) }),
  bulkSetupFeeStructures: (year: number, structures: any[]) =>
    request("/fees/structures/bulk-setup/", {
      method: "POST",
      body: JSON.stringify({ year, structures }),
    }),
  getFeeStructuresForPrint: (gradeLevel: string, year: number, term?: number) => {
    const params = new URLSearchParams({ gradeLevel, year: String(year) });
    if (term) params.append("term", String(term));
    return request(`/fees/structures/print/?${params.toString()}`).catch(() => []);
  },
  getChangeHistory: (year: number) => request(`/fees/history/?year=${year}`),

  // ============================================================
  // Fees - Levies (Additional Charges)
  // ============================================================
  applyLevyToInvoices: (levyId: number | string, mode: string, dueDate?: string | null) =>
    request("/fees/invoices/apply_levy/", {
      method: "POST",
      body: JSON.stringify({ levy_id: levyId, mode, due_date: dueDate }),
    }),
  getLevies: (year: number, term?: number | null) =>
    request(`/fees/levies/?year=${year}${term ? `&term=${term}` : ""}`),
  createLevy: (data: any) =>
    request("/fees/levies/", { method: "POST", body: JSON.stringify(data) }),
  updateLevy: (id: string | number, data: any) =>
    request(`/fees/levies/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteLevy: (id: string | number) => request(`/fees/levies/${id}/`, { method: "DELETE" }),

  // Per-student levies
  getStudentLevies: (studentId: string) =>
    request(`/fees/levies/?student=${studentId}`).catch(() => []),
  recordLevyPayment: (data: any) =>
    request("/fees/levies/pay/", { method: "POST", body: JSON.stringify(data) }),

  // ============================================================
  // Fees - M-Pesa STK Push
  // ============================================================
  initiateMpesaStkPush: (data: {
    student_id: string;
    amount: number | string;
    phone_number: string;
  }) => request("/fees/mpesa/stk-push/", { method: "POST", body: JSON.stringify(data) }),
  checkMpesaPaymentStatus: (checkoutRequestId: string) =>
    request(`/fees/mpesa/status/${checkoutRequestId}/`),

  // ============================================================
  // Messaging
  // ============================================================
  getMessages: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/messaging/school-messages/${query}`).catch(() => []);
  },
  getParentMessages: (studentId: string) =>
    request(`/messaging/school-messages/?student=${studentId}`).catch(() => []),
  sendMessage: (data: any) =>
    request("/messaging/school-messages/", { method: "POST", body: JSON.stringify(data) }),
  markMessageRead: (id: string | number) =>
    request(`/messaging/school-messages/${id}/read/`, { method: "POST" }).catch(() => null),

  getParentReplies: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/messaging/replies/${query}`).catch(() => []);
  },
  sendParentReply: (data: any) =>
    request("/messaging/replies/", { method: "POST", body: JSON.stringify(data) }),
  markReplyRead: (id: string | number) =>
    request(`/messaging/replies/${id}/read/`, { method: "POST" }).catch(() => null),

  // ============================================================
  // Exams & Marks
  // ============================================================
  exams: {
    // CRUD
    list: (params: Record<string, any> = {}) => request(`/exams/${toQuery(params)}`),
    get: (id: string | number) => request(`/exams/${id}/`),
    create: (data: any) => request("/exams/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string | number, data: any) =>
      request(`/exams/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string | number) => request(`/exams/${id}/`, { method: "DELETE" }),

    // Status
    publish: (id: string | number) => request(`/exams/${id}/publish/`, { method: "POST" }),
    setExamStatus: (id: string | number, status: string) =>
      request(`/exams/${id}/set_status/`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),

    // Scores
    getMyExamSubjects: (examId: string | number) => request(`/exams/${examId}/my_subjects/`),
    getExamSubjectScores: (examSubjectId: string | number) =>
      request(`/exams/exam-subjects/${examSubjectId}/scores/`),
    saveExamSubjectScores: (examSubjectId: string | number, scores: any[]) =>
      request(`/exams/exam-subjects/${examSubjectId}/scores/`, {
        method: "POST",
        body: JSON.stringify({ scores }),
      }),
    getMyGrading: () => request("/exams/my_grading/"),

    // Report cards
    getStudentReportCardsList: (studentId: string) =>
      request(`/exams/students/${studentId}/report-cards/`),
    getClassReportCards: (classId: string, year: number, term: number) =>
      request(`/exams/report-cards/class/?class_room=${classId}&year=${year}&term=${term}`),
    getStudentReportCard: (studentId: string, year: number, term: number) =>
      request(`/exams/students/${studentId}/report-card/?year=${year}&term=${term}`),

    // Teacher comments
    getStudentComment: (studentId: string, year: number, term: number) =>
      request(`/exams/students/${studentId}/comment/${toQuery({ year, term })}`),
    saveStudentComment: (studentId: string, year: number, term: number, comment: string) =>
      request(`/exams/students/${studentId}/comment/${toQuery({ year, term })}`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
    saveBulkStudentComments: (year: number, term: number, comments: any[]) =>
      request("/exams/comments/bulk-save/", {
        method: "POST",
        body: JSON.stringify({ year, term, comments }),
      }),
  },
};
