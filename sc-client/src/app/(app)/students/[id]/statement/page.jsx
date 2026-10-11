"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { feesApi } from "@/lib/feesApi";

export default function StatementPrintPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    feesApi
      .getStudentStatement(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!data || !autoPrint) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [data, autoPrint]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h2>Could not load statement</h2>
        <p>{error}</p>
      </div>
    );
  }
  if (!data) {
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;
  }

  const { student, balance, entries } = data;

  return (
    <>
      <style>{printStyles}</style>

      <div className="print-toolbar no-print">
        <span>Fee statement — {student.name}</span>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
        <button onClick={() => window.close()} className="secondary">
          Close
        </button>
      </div>

      <div className="page">
        <header className="page-header">
          <div className="school">SchoolWise Academy</div>
          <div className="doc-title">Fee Statement</div>
        </header>

        <section className="meta">
          <div>
            <span className="label">Student</span>
            <span className="value">{student.name}</span>
          </div>
          <div>
            <span className="label">Admission</span>
            <span className="value">{student.admissionNumber}</span>
          </div>
          <div>
            <span className="label">Class</span>
            <span className="value">{student.className || "—"}</span>
          </div>
          <div>
            <span className="label">Issued on</span>
            <span className="value">{new Date().toLocaleDateString("en-KE")}</span>
          </div>
        </section>

        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Reference</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
              <th className="num">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              entries.map((e, i) => (
                <tr key={i}>
                  <td>{e.date}</td>
                  <td>{e.description}</td>
                  <td className="mono">{e.reference || "—"}</td>
                  <td className="num">{e.debit ? format(e.debit) : ""}</td>
                  <td className="num credit">{e.credit ? format(e.credit) : ""}</td>
                  <td className="num bold">{format(e.balance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <section className="summary">
          <div>
            <span className="label">Current balance</span>
            <span className={`value ${Number(balance) > 0 ? "owed" : "credit-ok"}`}>
              {format(balance)}
            </span>
          </div>
          <div className="note">
            {Number(balance) > 0
              ? "Amount outstanding. Please clear before the end of term."
              : Number(balance) < 0
                ? "Credit on account — will apply to future invoices."
                : "Fully paid. Thank you."}
          </div>
        </section>

        <footer className="page-footer">
          <div className="signature">
            <div className="line" />
            <div className="caption">Bursar</div>
          </div>
          <div className="stamp">School stamp</div>
        </footer>
      </div>
    </>
  );
}

function format(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

const printStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #eee; color: #111; }
  .no-print { display: block; }
  .print-toolbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; gap: 12px;
    padding: 12px 20px; background: #1a1a2e; color: #fff;
    font-family: system-ui, sans-serif; font-size: 14px;
  }
  .print-toolbar span { flex: 1; }
  .print-toolbar button {
    padding: 8px 16px; border-radius: 6px; border: none;
    background: #4caf50; color: #fff; font-weight: 600; cursor: pointer;
  }
  .print-toolbar button.secondary { background: transparent; border: 1px solid rgba(255,255,255,0.4); }

  .page {
    width: 210mm; min-height: 297mm;
    padding: 18mm 16mm; margin: 24px auto;
    background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .page-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 18px; }
  .school { font-size: 20px; font-weight: 700; }
  .doc-title { font-size: 14px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; color: #555; }

  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 20px; font-size: 12px; }
  .meta > div { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 4px 0; }
  .meta .label { color: #555; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  .meta .value { font-weight: 600; }

  .ledger { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
  .ledger th, .ledger td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
  .ledger thead th { background: #f0f0f0; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; }
  .ledger .num { text-align: right; }
  .ledger .bold { font-weight: 700; }
  .ledger .credit { color: #2e7d32; }
  .ledger .mono { font-family: ui-monospace, monospace; font-size: 10px; }
  .ledger .empty { text-align: center; color: #888; font-style: italic; }

  .summary {
    padding: 12px 16px; border: 1px solid #999; background: #f9f9f9;
    display: flex; justify-content: space-between; align-items: center;
  }
  .summary .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; display: block; }
  .summary .value { font-size: 22px; font-weight: 700; display: block; margin-top: 2px; }
  .summary .value.owed { color: #c62828; }
  .summary .value.credit-ok { color: #2e7d32; }
  .summary .note { font-size: 11px; color: #555; max-width: 40ch; text-align: right; }

  .page-footer {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: 40px; padding-top: 12px; border-top: 1px dashed #999;
  }
  .signature { text-align: center; }
  .signature .line { border-bottom: 1px solid #111; height: 32px; width: 180px; margin-bottom: 4px; }
  .signature .caption { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .stamp {
    font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 10px 20px; border: 2px dashed #ccc; border-radius: 50%; transform: rotate(-8deg);
  }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .page { box-shadow: none; margin: 0; padding: 12mm 14mm; width: 100%; }
  }
  @page { size: A4; margin: 0; }
`;
