/**
 * Real API integration for SchoolWise Hub.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://72.62.182.26:8082/api";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: any = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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

export const api = {
  // Auth
  me: () => request("/auth/me/"),
  updateProfile: (data: any) => request("/auth/me/", { method: "PATCH", body: JSON.stringify(data) }),
  updateAvatar: (formData: FormData) => fetch(`${BASE_URL}/auth/me/`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
    body: formData
  }).then(res => res.json()),

  // Staff
  getStaff: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/staff/${query}`);
  },
  getStaffById: (id: string) => request(`/staff/${id}/`),

  // Finance
  getFeeCollectionSummary: () => request("/fees/summary/").catch(() => ({ collectionRate: 0, totalInvoiced: 0, totalCollected: 0 })),
  getPayroll: (month: number, year: number) => request(`/payroll/?month=${month}&year=${year}`).catch(() => []),

  // Attendance
  /** Fetch attendance records for a class within an inclusive date range. */
  getAttendance: (classId: string, dateFrom: string, dateTo: string) =>
    request(`/attendance/?class_room=${classId}&date_from=${dateFrom}&date_to=${dateTo}`).catch(() => []),

  /** Idempotent bulk upsert — create or update attendance for a full week. */
  saveAttendanceBulk: (records: any[]) =>
    request("/attendance/bulk_save/", { method: "POST", body: JSON.stringify(records) }),

  /** Per-day attendance counts for a class in a date range. */
  getAttendanceSummary: (classId: string, dateFrom: string, dateTo: string) =>
    request(`/attendance/summary/?class_room=${classId}&date_from=${dateFrom}&date_to=${dateTo}`).catch(() => []),


  // Students
  getStudents: (params?: any) => {
    const p = { ...params };
    if (p.classId) { p.class_room = p.classId; delete p.classId; }
    if (p.boardingStatus) {
      if (p.boardingStatus !== "all") p.boarding_status = p.boardingStatus;
      delete p.boardingStatus;
    }
    if (p.status === "all") delete p.status;
    const query = new URLSearchParams(p).toString();
    return request(`/students/${query ? "?" + query : ""}`);
  },
  getStudent: (id: string) => request(`/students/${id}/`),
  createStudent: (data: any) => {
    const payload = { ...data };

    // Auto-generate ID and admission number if missing
    if (!payload.id) payload.id = `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (!payload.admissionNumber) payload.admissionNumber = `ADM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // Flatten parent fields if they are nested in the frontend but flat in the backend serializer Meta.fields
    if (payload.parent) {
      payload.father_name = payload.parent.fatherName;
      payload.mother_name = payload.parent.motherName;
      payload.primary_contact_name = payload.parent.primaryContactName;
      payload.primary_contact_phone = payload.parent.primaryContactPhone;
      delete payload.parent;
    }

    if (typeof payload.photo === "string") {
      delete payload.photo;
    }

    if (payload.photo instanceof File) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, v instanceof Blob ? v : String(v));
        }
      });
      return request("/students/", { method: "POST", body: formData });
    }

    return request("/students/", { method: "POST", body: JSON.stringify(payload) });
  },
  updateStudent: (id: string, data: any) => {
    const payload = { ...data };

    if (payload.parent) {
      payload.father_name = payload.parent.fatherName;
      payload.mother_name = payload.parent.motherName;
      payload.primary_contact_name = payload.parent.primaryContactName;
      payload.primary_contact_phone = payload.parent.primaryContactPhone;
      delete payload.parent;
    }

    if (typeof payload.photo === "string") {
      delete payload.photo;
    }

    if (payload.photo instanceof File) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, v instanceof Blob ? v : String(v));
        }
      });
      return request(`/students/${id}/`, { method: "PATCH", body: formData });
    }

    return request(`/students/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  deleteStudent: (id: string) => request(`/students/${id}/`, { method: "DELETE" }),
  updateStudentAvatar: (id: string, photoUrl: string) => request(`/students/${id}/`, { method: "PATCH", body: JSON.stringify({ photo: photoUrl }) }),

  // Classes
  getClasses: () => request("/academics/classes/"),
  getClass: (id: string) => request(`/academics/classes/${id}/`),
  createClass: (data: any) => request("/academics/classes/", { method: "POST", body: JSON.stringify(data) }),
  updateClass: (id: string, data: any) => request(`/academics/classes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  getClassById: (id: string) => request(`/academics/classes/${id}/`),

  // School profile
  getSchool: () => request("/school/profile/").catch(() => null),
  getIntegrationsStatus: () => request("/school/integrations-status/").catch(() => ({
    emailConfigured: false, mpesaConfigured: false, smsConfigured: false,
  })),
  getSchoolSettings: () => request("/school/profile/").catch(() => null),
  updateSchoolSettings: (data: any) => request("/school/profile/", { method: "PATCH", body: JSON.stringify(data) }),
  getStudentsByClass: (classId: string) => request(`/students/?class_room=${classId}`),

  // Subjects CRUD
  getSubjects: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/subjects/${query}`);
  },
  getSubjectById: (id: string) => request(`/academics/subjects/${id}/`),
  createSubject: (data: any) => request("/academics/subjects/", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id: string, data: any) => request(`/academics/subjects/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Assignments / ClassSubjects
  getClassSubjects: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/assignments/${query}`);
  },
  createClassSubject: (data: any) => request("/academics/assignments/", { method: "POST", body: JSON.stringify(data) }),
  updateClassSubject: (id: string, patch: any) => request(`/academics/assignments/${id}/`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteClassSubject: (id: string) => request(`/academics/assignments/${id}/`, { method: "DELETE" }),
  getTeacherLoad: (staffId: string) => request(`/academics/assignments/?teacherId=${staffId}`).then(res => {
    const list = Array.isArray(res) ? res : [];
    const totalPeriods = list.reduce((s: number, cs: any) => s + (cs.periodsPerWeek ?? 5), 0);
    return { classSubjects: list, totalPeriods };
  }),
  assignTeacherToSubject: (classId: string, subjectId: string, teacherId: string) => {
    return request(`/academics/assignments/?classId=${classId}&subjectId=${subjectId}`).then((res: any) => {
      const list = Array.isArray(res) ? res : [];
      if (list.length > 0) {
        return request(`/academics/assignments/${list[0].id}/`, { method: "PATCH", body: JSON.stringify({ teacherId }) });
      } else {
        return request("/academics/assignments/", { method: "POST", body: JSON.stringify({ classId, subjectId, teacherId }) });
      }
    });
  },

  // Timetable
  getTimetable: (classId: string) => request(`/academics/timetable/?classId=${classId}`),
  getTeacherTimetable: (staffId: string) => request(`/academics/timetable/?teacherId=${staffId}`),
  saveTimetable: (classId: string, slots: any[]) => request("/academics/timetable/bulk_save/", { method: "POST", body: JSON.stringify({ classId, slots }) }),
  generateAutoTimetable: (classId: string) => request("/academics/timetable/generate_auto/", { method: "POST", body: JSON.stringify({ classId }) }),

  // Exams & Marks integration
  getExams: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/exams/${query}`).catch(() => []);
  },
  getExamById: (id: string | number) => request(`/academics/exams/${id}/`),
  createExam: (data: any) => request("/academics/exams/", { method: "POST", body: JSON.stringify(data) }),
  publishExamResults: (id: string | number) => request(`/academics/exams/${id}/`, { method: "PATCH", body: JSON.stringify({ status: "published" }) }),

  getExamMarks: (examId: string | number, classId: string, subjectId?: string) => {
    const subParam = subjectId ? `&subject=${subjectId}` : "";
    return request(`/academics/marks/?exam=${examId}&class_room=${classId}${subParam}`)
      .then((res) => (res || []).map((m: any) => ({
        ...m,
        marks: m.score != null ? Number(m.score) : null,
        teacherComment: m.comment || "",
      })))
      .catch(() => []);
  },
  saveExamMarks: (examId: string | number, classId: string, marks: any[]) => {
    const formatted = marks.map((r: any) => ({
      studentId: r.studentId,
      subjectId: r.subjectId,
      score: r.marks != null ? Number(r.marks) : 0,
      comment: r.teacherComment || r.comment || "",
    }));
    return request("/academics/marks/bulk-save/", { method: "POST", body: JSON.stringify({ examId, classId, marks: formatted }) });
  },
  saveClassTeacherComments: (examId: string | number, classId: string, comments: any[]) =>
    request("/academics/class-teacher-comments/bulk-save/", {
      method: "POST",
      body: JSON.stringify({ examId, classId, comments }),
    }),

  generateReportCards: async (examId: string | number, classId: string) => {
    const [studentsRes, marks, subjects, exam, classRoom, ctComments] = await Promise.all([
      request(`/students/?class_room=${classId}`),
      request(`/academics/marks/?exam=${examId}&class_room=${classId}`),
      request("/academics/subjects/").then((res) => (Array.isArray(res) ? res : res.results || res)),
      request(`/academics/exams/${examId}/`).catch(() => null),
      request(`/academics/classes/${classId}/`).catch(() => null),
      request(`/academics/class-teacher-comments/?exam=${examId}&class_room=${classId}`).catch(() => []),
    ]);
    const commentsByStudent: Record<string, string> = {};
    (Array.isArray(ctComments) ? ctComments : []).forEach((c: any) => {
      commentsByStudent[c.studentId || c.student] = c.comment || "";
    });

    const students = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || studentsRes || [];
    const marksList = Array.isArray(marks) ? marks : [];
    const dateFrom = exam?.startDate || exam?.start_date || `${new Date().getFullYear()}-01-01`;
    const dateTo = exam?.endDate || exam?.end_date || new Date().toISOString().slice(0, 10);

    const attendanceByStudent: Record<string, { present: number; absent: number; total: number }> = {};
    await Promise.all(
      students.map(async (student: any) => {
        const records = await request(
          `/attendance/?student=${student.id}&date_from=${dateFrom}&date_to=${dateTo}`
        ).catch(() => []);
        const list = Array.isArray(records) ? records : [];
        attendanceByStudent[student.id] = {
          present: list.filter((r: any) => r.status === "present").length,
          absent: list.filter((r: any) => r.status === "absent").length,
          total: list.length,
        };
      })
    );

    const defaultMap: Record<string, string> = {
      A: "#2e7d32", "A-": "#4caf50",
      "B+": "#8bc34a", B: "#9c27b0", "B-": "#ba68c8",
      "C+": "#ff9800", C: "#fb8c00", "C-": "#f57c00",
      "D+": "#e64a19", D: "#d84315", "D-": "#bf360c",
      E: "#c62828",
    };
    const getGrade = (val: number) => {
      if (val >= 80) return "A";
      if (val >= 75) return "A-";
      if (val >= 70) return "B+";
      if (val >= 65) return "B";
      if (val >= 60) return "B-";
      if (val >= 55) return "C+";
      if (val >= 50) return "C";
      if (val >= 45) return "C-";
      if (val >= 40) return "D+";
      if (val >= 35) return "D";
      if (val >= 30) return "D-";
      return "E";
    };
    const getCbcRating = (val: number) => {
      if (val >= 80) return "EE";
      if (val >= 60) return "ME";
      if (val >= 40) return "AE";
      return "BE";
    };
    const principalComment = (avg: number) =>
      avg >= 70 ? "Excellent performance. Keep up the good work." : avg >= 50 ? "Satisfactory progress. Continue working hard." : "Needs improvement. More effort required next term.";

    const studentReportCards = students.map((student: any) => {
      const studentMarks = marksList.filter((m: any) => m.studentId === student.id || m.student?.id === student.id);
      const curriculum = student.curriculum || classRoom?.curriculum || "CBC";

      const subjectsRc = studentMarks.map((m: any) => {
        const subject = subjects.find((s: any) => s.id === m.subjectId || s.id === m.subject?.id);
        const score = m.score != null ? Number(m.score) : 0;
        const gradeRule = subject?.gradingSystem?.find((r: any) => score >= r.min && score <= r.max);
        const grade = gradeRule?.grade || getGrade(score);
        return {
          subjectId: m.subjectId || m.subject?.id,
          subjectName: m.subjectName || subject?.name || "",
          marks: score,
          grade,
          color: gradeRule?.color || defaultMap[grade] || "#757575",
          cbcRating: curriculum === "CBC" ? getCbcRating(score) : undefined,
          teacherComment: m.comment || "",
          outOf: 100,
        };
      });

      const totalMarks = subjectsRc.reduce((acc: number, curr: any) => acc + curr.marks, 0);
      const average = subjectsRc.length > 0 ? Math.round(totalMarks / subjectsRc.length) : 0;
      const averageGrade = getGrade(average);
      const classTeacherComment = commentsByStudent[student.id] || "";
      const att = attendanceByStudent[student.id] || { present: 0, absent: 0, total: 0 };

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        classId,
        className: student.className || classRoom?.name || "",
        curriculum,
        term: exam?.term ?? 1,
        year: exam?.year ?? new Date().getFullYear(),
        examId,
        subjects: subjectsRc,
        totalMarks,
        average,
        averageGrade,
        averageGradeColor: defaultMap[averageGrade] || "#2e7d32",
        classTeacherComment: classTeacherComment || (average >= 70 ? "Excellent performance. Keep it up!" : average >= 50 ? "Good effort. Aim higher next term." : "Needs to work harder."),
        principalComment: principalComment(average),
        attendance: { daysPresent: att.present, daysAbsent: att.absent, totalDays: att.total || att.present + att.absent },
        position: 0,
        classSize: students.length,
      };
    });

    studentReportCards.sort((a: any, b: any) => b.average - a.average);
    studentReportCards.forEach((rc: any, idx: number) => {
      rc.position = idx + 1;
    });

    return studentReportCards;
  },

  getStudentReportCard: async (studentId: string, examId: string) => {
    const student = await api.getStudent(studentId);
    const classId = student.classId || student.class_room;
    if (!classId) throw new Error("Student has no class assigned");
    const cards = await api.generateReportCards(examId, classId);
    const card = cards.find((rc: any) => rc.studentId === studentId);
    if (!card) throw new Error("No results found for this exam");
    return card;
  },

  // Student-specific attendance
  getStudentAttendance: (studentId: string, start: string, end: string) =>
    request(`/attendance/?student=${studentId}&date_from=${start}&date_to=${end}`)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        return list.map((r: any) => ({ ...r, reason: r.remarks || r.reason || "" }));
      })
      .catch(() => []),

  // Fees
  getStudentInvoice: (studentId: string) => request(`/fees/invoices/current/?student=${studentId}`).catch(() => ({ items: [], balance: 0 })),
  getPayments: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return request(`/fees/payments/?${query}`).catch(() => []);
  },
  getStudentLevies: (studentId: string) => request(`/fees/levies/?student=${studentId}`).catch(() => []),
  recordLevyPayment: (data: any) => request("/fees/levies/pay/", { method: "POST", body: JSON.stringify(data) }),

  // Fee Structures
  getFeeStructures: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/fees/structures/${query}`).catch(() => []);
  },
  getFeeStructure: (id: string | number) => request(`/fees/structures/${id}/`),
  createFeeStructure: (data: any) => request("/fees/structures/", { method: "POST", body: JSON.stringify(data) }),
  reviseFeeStructure: (id: string | number, data: any) =>
    request(`/fees/structures/${id}/revise/`, { method: "POST", body: JSON.stringify(data) }),
  bulkSetupFeeStructures: (year: number, structures: any[]) =>
    request("/fees/structures/bulk-setup/", { method: "POST", body: JSON.stringify({ year, structures }) }),
  getFeeStructuresForPrint: (gradeLevel: string, year: number, term?: number) => {
    const params = new URLSearchParams({ gradeLevel, year: String(year) });
    if (term) params.append("term", String(term));
    return request(`/fees/structures/print/?${params.toString()}`).catch(() => []);
  },

  // Term Planner
  getTermEvents: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/term-events/${query}`).catch(() => []);
  },
  createTermEvent: (data: any) => request("/academics/term-events/", { method: "POST", body: JSON.stringify(data) }),
  updateTermEvent: (id: string | number, data: any) => request(`/academics/term-events/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTermEvent: (id: string | number) => request(`/academics/term-events/${id}/`, { method: "DELETE" }),
  approveTermEvent: (id: string | number, _reviewerId?: string, _reviewerName?: string) =>
    request(`/academics/term-events/${id}/approve/`, { method: "POST" }),
  rejectTermEvent: (id: string | number, _reviewerId?: string, _reviewerName?: string, reason?: string) =>
    request(`/academics/term-events/${id}/reject/`, { method: "POST", body: JSON.stringify({ reason: reason || "" }) }),

  // Academic Terms
  getAcademicTerms: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/academics/terms/${query}`).catch(() => []);
  },
  getAcademicTerm: (id: string | number) => request(`/academics/terms/${id}/`),
  createAcademicTerm: (data: any) => request("/academics/terms/", { method: "POST", body: JSON.stringify(data) }),
  updateAcademicTerm: (id: string | number, data: any) => request(`/academics/terms/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAcademicTerm: (id: string | number) => request(`/academics/terms/${id}/`, { method: "DELETE" }),
  setupAcademicYear: (year: number, terms: any[]) =>
    request("/academics/terms/setup-year/", { method: "POST", body: JSON.stringify({ year, terms }) }),

  // Messaging
  getMessages: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/messaging/school-messages/${query}`).catch(() => []);
  },
  getParentMessages: (studentId: string) =>
    request(`/messaging/school-messages/?student=${studentId}`).catch(() => []),
  sendMessage: (data: any) => request("/messaging/school-messages/", { method: "POST", body: JSON.stringify(data) }),
  markMessageRead: (id: string | number) =>
    request(`/messaging/school-messages/${id}/read/`, { method: "POST" }).catch(() => null),
  getParentReplies: (filters?: any) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return request(`/messaging/replies/${query}`).catch(() => []);
  },
  sendParentReply: (data: any) => request("/messaging/replies/", { method: "POST", body: JSON.stringify(data) }),
  markReplyRead: (id: string | number) =>
    request(`/messaging/replies/${id}/read/`, { method: "POST" }).catch(() => null),

  getClassPerformanceReport: (classId: string, examId: string) =>
    request(`/academics/performance/?class_room=${classId}&exam=${examId}`).catch(() => ({ subjectStats: [] })),
  getSchoolPerformanceTrend: () =>
    request("/academics/performance/trend/").catch(() => []),
  getKNEC7Best: (classId: string, examId: string) =>
    request(`/academics/exams/knec7/?class_room=${classId}&exam=${examId}`).catch(() => []),

  // Admissions
  /**
   * Public submission from the website apply form. Deliberately bypasses the
   * shared request() helper: that helper always attaches whatever token is
   * sitting in localStorage, and a stale/expired one causes SimpleJWT to
   * reject the request with 401 *before* the backend's AllowAny permission
   * is ever checked. This endpoint must work for anonymous site visitors
   * regardless of what's left over in the browser from a previous session.
   */
  submitApplication: async (data: any) => {
    const response = await fetch(`${BASE_URL}/students/applications/`, {
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
    return request(`/students/applications/${query}`).catch(() => []);
  },
  getApplication: (id: string | number) => request(`/students/applications/${id}/`),
  /** Non-terminal transitions: interview_scheduled | offered | rejected | withdrawn. */
  updateApplicationStatus: (id: string | number, statusValue: string, extra?: any) =>
    request(`/students/applications/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status: statusValue, ...extra }),
    }),
  /** Converts an offered application into a real Student + parent account. */
  convertApplication: (id: string | number, classId: string) =>
    request(`/students/applications/${id}/convert/`, {
      method: "POST",
      body: JSON.stringify({ classId }),
    }),
  updateApplication: (id: string | number, data: any) =>
    request(`/students/applications/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
