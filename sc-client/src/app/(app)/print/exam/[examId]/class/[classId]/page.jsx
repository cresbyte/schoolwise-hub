"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { examsApi } from "@/lib/examsApi";

export default function PrintClassReportsPage() {
  const { examId, classId } = useParams();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("print") !== "0";
  const singleStudentId = searchParams.get("student");

  const [cards, setCards] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    examsApi
      .getClassReport(examId, classId)
      .then((data) => {
        let list = Array.isArray(data) ? data : [];
        if (singleStudentId) {
          list = list.filter((c) => c.student.id === singleStudentId);
        }
        setCards(list);
      })
      .catch((e) => setError(e.message));
  }, [examId, classId, singleStudentId]);

  // Trigger the browser print dialog after the cards render.
  useEffect(() => {
    if (!cards || !autoPrint) return;
    // Give the browser a tick to lay out the DOM and load any fonts.
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, [cards, autoPrint]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h2>Could not load report cards</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!cards) {
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;
  }

  if (cards.length === 0) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h2>No students to print</h2>
        <p>This class has no active enrollments in this exam’s academic year.</p>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <div className="print-toolbar no-print">
        <span>
          {cards.length} report card{cards.length === 1 ? "" : "s"} ready
        </span>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
        <button onClick={() => window.close()} className="secondary">
          Close
        </button>
      </div>

      <div className="cards">
        {cards.map((card) => (
          <ReportCardPrint key={card.student.id} card={card} />
        ))}
      </div>
    </>
  );
}

function ReportCardPrint({ card }) {
  const { student, exam, subjects, totals, comments, rank } = card;

  return (
    <div className="card">
      <header className="card-header">
        <div className="school">SchoolWise Academy</div>
        <div className="exam-title">{exam.name}</div>
        <div className="term">{exam.term}</div>
      </header>

      <section className="student-info">
        <div>
          <span className="label">Student</span>
          <span className="value">{student.name}</span>
        </div>
        <div>
          <span className="label">Admission</span>
          <span className="value">{student.admissionNumber}</span>
        </div>
        <div>
          <span className="label">Grade</span>
          <span className="value">{student.gradeLevel}</span>
        </div>
        <div>
          <span className="label">Class</span>
          <span className="value">{student.className}</span>
        </div>
        {rank != null && (
          <div>
            <span className="label">Position</span>
            <span className="value">{rank}</span>
          </div>
        )}
      </section>

      <table className="marks">
        <thead>
          <tr>
            <th>Subject</th>
            <th className="num">Score</th>
            <th className="grade">Grade</th>
            <th className="num">Points</th>
            <th>Teacher’s remarks</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.subjectId}>
              <td>{s.subjectName}</td>
              <td className="num">{s.score ?? "—"}</td>
              <td className="grade">{s.grade || "—"}</td>
              <td className="num">{s.points || "—"}</td>
              <td className="remarks">{s.comment || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="totals">
        <div>
          <span className="label">Total points</span>
          <span className="value">{totals.totalPoints}</span>
        </div>
        <div>
          <span className="label">Mean points</span>
          <span className="value">{totals.meanPoints}</span>
        </div>
        <div>
          <span className="label">Mean score</span>
          <span className="value">{totals.meanScore}%</span>
        </div>
      </section>

      <section className="comments">
        <div>
          <div className="label">Class teacher’s comment</div>
          <div className="body">{comments.classTeacher || "—"}</div>
        </div>
        <div>
          <div className="label">Head teacher’s comment</div>
          <div className="body">{comments.headTeacher || "—"}</div>
        </div>
      </section>

      <footer className="card-footer">
        <div className="signature">
          <div className="line" />
          <div className="caption">Class teacher</div>
        </div>
        <div className="signature">
          <div className="line" />
          <div className="caption">Head teacher</div>
        </div>
        <div className="stamp">School stamp</div>
      </footer>
    </div>
  );
}

const printStyles = `
  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: "Georgia", "Times New Roman", serif;
    background: #eee;
    color: #111;
  }

  .no-print { display: block; }

  .print-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: #1a1a2e;
    color: #fff;
    font-family: system-ui, sans-serif;
    font-size: 14px;
  }
  .print-toolbar span { flex: 1; }

  .print-toolbar button {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    background: #4caf50;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .print-toolbar button.secondary {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.4);
  }

  .cards {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px 12px 48px;
  }

  .card {
    width: 210mm;                /* A4 */
    min-height: 297mm;
    padding: 18mm 16mm;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
  }
  .card:last-child { page-break-after: auto; break-after: auto; }

  .card-header {
    text-align: center;
    border-bottom: 2px solid #111;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .school {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .exam-title {
    font-size: 15px;
    margin-top: 4px;
  }
  .term {
    font-size: 12px;
    color: #555;
    margin-top: 2px;
  }

  .student-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 24px;
    margin-bottom: 20px;
    font-size: 12px;
  }
  .student-info > div {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dotted #ccc;
    padding: 4px 0;
  }
  .student-info .label {
    color: #555;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
  }
  .student-info .value { font-weight: 600; }

  .marks {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 18px;
  }
  .marks th, .marks td {
    border: 1px solid #999;
    padding: 6px 8px;
    text-align: left;
  }
  .marks thead th {
    background: #f0f0f0;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .marks .num { text-align: right; width: 60px; }
  .marks .grade { text-align: center; width: 60px; font-weight: 700; }
  .marks .remarks { font-style: italic; color: #333; }

  .totals {
    display: flex;
    justify-content: space-around;
    padding: 10px;
    border: 1px solid #999;
    background: #f9f9f9;
    margin-bottom: 18px;
  }
  .totals .label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #555;
  }
  .totals .value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    margin-top: 2px;
  }

  .comments {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  .comments .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #555;
    margin-bottom: 4px;
  }
  .comments .body {
    font-size: 12px;
    min-height: 40px;
    padding: 8px;
    border: 1px solid #999;
    background: #fcfcfc;
    font-style: italic;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px dashed #999;
  }
  .signature { text-align: center; flex: 1; }
  .signature .line {
    border-bottom: 1px solid #111;
    height: 32px;
    margin-bottom: 4px;
  }
  .signature .caption {
    font-size: 10px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .stamp {
    font-size: 10px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 20px;
    border: 2px dashed #ccc;
    border-radius: 50%;
    transform: rotate(-8deg);
  }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .cards { gap: 0; padding: 0; }
    .card {
      box-shadow: none;
      width: 100%;
      padding: 12mm 14mm;
      page-break-after: always;
      break-after: page;
    }
    .card:last-child { page-break-after: auto; break-after: auto; }
  }

  @page {
    size: A4;
    margin: 0;
  }
`;
