import { request, toQuery } from "./http";

export const examsApi = {
  // ---- exams -----------------------------------------------------------
  list: (filters = {}) => request(`/exams/${toQuery(filters)}`).catch(() => []),
  get: (id) => request(`/exams/${id}/`),
  create: (data) =>
    request("/exams/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/exams/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/exams/${id}/`, { method: "DELETE" }),

  // ---- lifecycle -------------------------------------------------------
  open: (id) => request(`/exams/${id}/open/`, { method: "POST" }),
  close: (id) => request(`/exams/${id}/close/`, { method: "POST" }),
  release: (id) => request(`/exams/${id}/release/`, { method: "POST" }),
  reopen: (id) => request(`/exams/${id}/reopen/`, { method: "POST" }),

  // ---- subjects --------------------------------------------------------
  getSubjects: (examId) => request(`/exams/${examId}/subjects/`).catch(() => []),
  setupSubjects: (examId, gradeLevels, subjectIds) =>
    request(`/exams/${examId}/setup-subjects/`, {
      method: "POST",
      body: JSON.stringify({ gradeLevels, subjectIds }),
    }),

  // ---- marks -----------------------------------------------------------
  getRoster: (examSubjectId, classRoomId = null) =>
    request(
      `/exams/exam-subjects/${examSubjectId}/roster/${toQuery(
        classRoomId ? { class_room: classRoomId } : {}
      )}`
    ),
  saveMarks: (examSubjectId, records) =>
    request(`/exams/exam-subjects/${examSubjectId}/marks/`, {
      method: "POST",
      body: JSON.stringify({ examSubject: Number(examSubjectId), records }),
    }),
    getMissingMarks: (examId) =>
  request(`/exams/${examId}/missing-marks/`),

  // ---- comments --------------------------------------------------------
  getComments: (examId, classRoomId = null) =>
    request(
      `/exams/comments/${toQuery({ exam: examId, class_room: classRoomId })}`
    ).catch(() => []),
    getCommentRoster: (examId, classId) =>
  request(`/exams/comments/roster/${classId}/${toQuery({ exam: examId })}`)
    .catch(() => []),
  saveClassTeacherComments: (examId, comments) =>
    request("/exams/comments/class-teacher/bulk/", {
      method: "POST",
      body: JSON.stringify({ exam: examId, comments }),
    }),
  saveHeadTeacherComments: (examId, comments) =>
    request("/exams/comments/head-teacher/bulk/", {
      method: "POST",
      body: JSON.stringify({ exam: examId, comments }),
    }),
    getHeadTeacherCommentRoster: (examId, classId) =>
  request(`/exams/comments/roster/${classId}/${toQuery({ exam: examId })}`)
    .catch(() => []),

saveHeadTeacherComments: (examId, comments) =>
  request("/exams/comments/head-teacher/bulk/", {
    method: "POST",
    body: JSON.stringify({ exam: examId, comments }),
  }),

  // ---- report cards ----------------------------------------------------
  getStudentReportCard: (examId, studentId) =>
    request(`/exams/${examId}/report-card/${studentId}/`),
  getClassReport: (examId, classId) =>
    request(`/exams/${examId}/class-report/${classId}/`),

  // ---- my grading (teacher view) ---------------------------------------
  getMyGrading: () => request("/exams/my-grading/").catch(() => []),
};

export const EXAM_STATUS = {
  draft: { label: "Draft", color: "default" },
  open: { label: "Open", color: "info" },
  closed: { label: "Marks closed", color: "warning" },
  released: { label: "Released", color: "success" },
};


export const EXAM_TYPES = [
  { value: "cat", label: "CAT" },
  { value: "mid_term", label: "Mid-term" },
  { value: "end_term", label: "End of term" },
  { value: "mock", label: "Mock" },
  { value: "other", label: "Other" },
];
