// Bottom-nav-iconen — natgetrokken uit design/src/app.jsx NavIcon (schema =
// kalender, vorm = trend-lijn, trainingen = gestapelde rijen, niveau = staven).
export type TabKey =
  | "schema"
  | "vorm"
  | "trainingen"
  | "niveau"
  | "activiteiten";

export function NavIcon({ k }: { k: TabKey }) {
  const c = "currentColor";
  if (k === "schema") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4.5"
          width="14"
          height="13"
          rx="2"
          stroke={c}
          strokeWidth="1.5"
        />
        <path
          d="M3 8h14M7 2.5v4M13 2.5v4"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (k === "vorm") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 13l4-4 3 3 6-7"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.5 5H17.5V8"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (k === "trainingen") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="14"
          height="4.5"
          rx="1.4"
          stroke={c}
          strokeWidth="1.5"
        />
        <rect
          x="3"
          y="11.5"
          width="14"
          height="4.5"
          rx="1.4"
          stroke={c}
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (k === "activiteiten") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5" />
        <path
          d="M10 6v4.2l2.8 1.7"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 16V11M10 16V7M15 16V4"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
