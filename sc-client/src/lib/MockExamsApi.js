// @/lib/MockExamsApi.js

const wait = (data) => new Promise((resolve) => setTimeout(() => resolve(data), 300));

// CBC grading function
function getCBCTotalPoints(percentage) {
  if (percentage >= 80) return { grade: 'EE', points: 5, rating: 'Exceeding Expectations' };
  if (percentage >= 65) return { grade: 'ME', points: 4, rating: 'Meeting Expectations' };
  if (percentage >= 50) return { grade: 'AE', points: 3, rating: 'Approaching Expectations' };
  if (percentage >= 40) return { grade: 'BE', points: 2, rating: 'Below Expectations' };
  return { grade: 'NI', points: 1, rating: 'Needs Intervention' };
}

// Mock classes
const classes = [
  { id: 'cls-grade-4-blue', name: 'Grade 4 Blue', grade_level: 'Grade 4', stream: 'Blue' },
  { id: 'cls-grade-4-green', name: 'Grade 4 Green', grade_level: 'Grade 4', stream: 'Green' },
  { id: 'cls-grade-5-blue', name: 'Grade 5 Blue', grade_level: 'Grade 5', stream: 'Blue' },
  { id: 'cls-grade-6-blue', name: 'Grade 6 Blue', grade_level: 'Grade 6', stream: 'Blue' },
];

// Mock subjects
const subjects = [
  { id: 1, name: 'Mathematics', code: 'MATH' },
  { id: 2, name: 'English', code: 'ENG' },
  { id: 3, name: 'Kiswahili', code: 'KIS' },
  { id: 4, name: 'Science', code: 'SCI' },
  { id: 5, name: 'Social Studies', code: 'SOC' },
  { id: 6, name: 'CRE', code: 'CRE' },
  { id: 7, name: 'Agriculture', code: 'AGR' },
  { id: 8, name: 'Home Science', code: 'HOM' },
];

// Mock students for Grade 4 Blue
const students = [
  { id: 'STU001', first_name: 'John', last_name: 'Kamau', admission_number: 'ADM001', class_room: 'cls-grade-4-blue', grade_level: 'Grade 4' },
  { id: 'STU002', first_name: 'Mary', last_name: 'Wanjiku', admission_number: 'ADM002', class_room: 'cls-grade-4-blue', grade_level: 'Grade 4' },
  { id: 'STU003', first_name: 'Peter', last_name: 'Ochieng', admission_number: 'ADM003', class_room: 'cls-grade-4-blue', grade_level: 'Grade 4' },
  { id: 'STU004', first_name: 'Grace', last_name: 'Muthoni', admission_number: 'ADM004', class_room: 'cls-grade-4-blue', grade_level: 'Grade 4' },
  { id: 'STU005', first_name: 'David', last_name: 'Kipchoge', admission_number: 'ADM005', class_room: 'cls-grade-4-blue', grade_level: 'Grade 4' },
];

// Mock exams
const exams = [
  {
    id: 1,
    name: 'End of Term 1 Exams 2026',
    exam_type: 'endterm',
    year: 2026,
    term: 1,
    class_rooms: ['cls-grade-4-blue', 'cls-grade-4-green', 'cls-grade-5-blue', 'cls-grade-6-blue'],
    start_date: '2026-04-01',
    end_date: '2026-04-10',
    status: 'published',
  },
  {
    id: 2,
    name: 'CAT 2 Term 1 2026',
    exam_type: 'cat',
    year: 2026,
    term: 1,
    class_rooms: ['cls-grade-4-blue'],
    start_date: '2026-02-15',
    end_date: '2026-02-17',
    status: 'published',
  },
  {
    id: 3,
    name: 'End of Term 2 Exams 2026',
    exam_type: 'endterm',
    year: 2026,
    term: 2,
    class_rooms: ['cls-grade-4-blue'],
    start_date: '2026-08-01',
    end_date: '2026-08-10',
    status: 'draft',
  },
];

// Generate realistic scores for a student
function generateStudentScores(studentId, examId, classId) {
  const baseScores = {
    'STU001': [85, 78, 82, 88, 75, 90, 80, 85], // John - high performer
    'STU002': [72, 80, 75, 68, 82, 70, 78, 74], // Mary - good performer
    'STU003': [58, 62, 55, 60, 65, 58, 62, 60], // Peter - average
    'STU004': [92, 88, 90, 95, 85, 92, 88, 90], // Grace - excellent
    'STU005': [45, 52, 48, 50, 55, 42, 50, 48], // David - needs help
  };

  const scores = baseScores[studentId] || [70, 70, 70, 70, 70, 70, 70, 70];

  return subjects.map((subject, idx) => {
    const marks = scores[idx];
    const total = 100;
    const percentage = (marks / total) * 100;
    const cbc = getCBCTotalPoints(percentage);

    return {
      subjectName: subject.name,
      marks,
      outOf: total,
      percentage: percentage.toFixed(1),
      grade: cbc.grade,
      cbcRating: cbc.rating,
      points: cbc.points,
      teacherComment: getTeacherComment(cbc.grade),
    };
  });
}

function getTeacherComment(grade) {
  const comments = {
    'EE': 'Excellent performance, keep it up!',
    'ME': 'Good work, you are meeting expectations.',
    'AE': 'Fair performance, needs more effort.',
    'BE': 'Below average, requires additional support.',
    'NI': 'Needs immediate intervention and remedial classes.',
  };
  return comments[grade] || '';
}

// Generate report card for a student
function generateReportCard(student, examId) {
  const exam = exams.find(e => e.id === examId);
  const classRoom = classes.find(c => c.id === student.class_room);

  const subjects = generateStudentScores(student.id, examId, student.class_room);

  const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0);
  const totalPossible = subjects.reduce((sum, s) => sum + s.outOf, 0);
  const average = ((totalMarks / totalPossible) * 100).toFixed(1);

  // Calculate position (simplified - in real backend, compare with all students in class)
  const position = student.id === 'STU004' ? 1 : student.id === 'STU001' ? 2 : student.id === 'STU002' ? 3 : student.id === 'STU003' ? 4 : 5;

  return {
    studentId: student.id,
    studentName: `${student.first_name} ${student.last_name}`,
    admissionNumber: student.admission_number,
    className: classRoom.name,
    classId: classRoom.id,
    grade_level: student.grade_level,
    year: exam.year,
    term: exam.term,
    curriculum: 'CBC',
    subjects,
    totalMarks,
    totalPossible,
    average: parseFloat(average),
    position,
    classSize: 5,
    attendance: {
      daysPresent: 60,
      totalDays: 65,
    },
    classTeacherComment: 'A diligent student who participates actively in class activities.',
    principalComment: 'Good progress. Keep up the good work.',
  };
}

export const api = {
  getClasses: () => wait(classes),

  getExams: () => wait(exams),

  getReportCards: (examId, classId) => {
    if (!examId || !classId) return wait([]);

    const exam = exams.find(e => e.id === Number(examId));
    if (!exam) return wait([]);

    const classStudents = students.filter(s => s.class_room === classId);
    const reportCards = classStudents.map(student => generateReportCard(student, examId));

    // Sort by position
    reportCards.sort((a, b) => a.position - b.position);

    return wait(reportCards);
  },

  getReportCard: (studentId, examId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return wait(null);
    return wait(generateReportCard(student, examId));
  },
};
