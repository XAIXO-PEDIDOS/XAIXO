"use client";

export default function PrintControls({ cliente }: { cliente: string }) {
  return (
    <div
      className="no-print"
      style={{
        padding: "0.6rem 1.25rem",
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <button
        onClick={() => window.print()}
        style={{
          padding: "0.45rem 1rem",
          background: "#E5231B",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        🖨 Imprimir
      </button>
      <button
        onClick={() => window.close()}
        style={{
          padding: "0.45rem 0.9rem",
          background: "white",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "0.5rem",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        ✕ Cerrar
      </button>
      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
        {cliente} · La hoja imprime dos copias en A4 separadas por línea de corte
      </span>
    </div>
  );
}
