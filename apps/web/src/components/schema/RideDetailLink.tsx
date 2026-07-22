import { useState } from "react";
import { RideDetailSheet } from "./RideDetailSheet";

// RITDETAILS fase 2 — gedeelde "Bekijk ritdetails ›"-affordance (GAS Script.html:664). Trekt de
// knop + de RideDetailSheet-open-state in één component zodat BEIDE voltooid-kaarten (de
// gereduceerde DoneDetail én de volle DoneCompareCard) 'm hergebruiken. Leeg idExt (pre-migratie
// rit zonder intervals-id) → geen knop.
export function RideDetailLink({ idExt }: { idExt: string }) {
  const [open, setOpen] = useState(false);
  if (idExt === "") return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          alignSelf: "flex-start",
          border: "none",
          background: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          fontWeight: 600,
          color: "var(--accent)",
        }}
      >
        Bekijk ritdetails ›
      </button>
      {open && <RideDetailSheet id={idExt} onClose={() => setOpen(false)} />}
    </>
  );
}
