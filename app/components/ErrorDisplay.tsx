"use client";

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({
  message = "Failed to load data.",
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div
      style={{
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.38)",
        borderRadius: "8px",
        padding: "2rem",
        textAlign: "center",
        color: "#fca5a5",
        margin: "20px 0",
        backdropFilter: "blur(12px)",
      }}
    >
      <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            minHeight: "44px",
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
