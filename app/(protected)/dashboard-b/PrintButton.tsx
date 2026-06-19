"use client"

import { FiDownload } from "react-icons/fi"

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        backgroundColor: "var(--color-primary)",
        color: "white",
        border: "none",
        borderRadius: "var(--radius-md)",
        fontWeight: 700,
        cursor: "pointer"
      }}
      className="print:hidden"
    >
      <FiDownload /> Export PDF
    </button>
  )
}
