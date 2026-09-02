"use client";

import { useBookingStore } from "../store";
import { StepIndicator } from "./StepIndicator";
import { SummaryPanel } from "./SummaryPanel";
import { SelectService } from "./steps/SelectService";
import { ChooseDate } from "./steps/ChooseDate";
import { SelectTime } from "./steps/SelectTime";
import { YourDetails } from "./steps/YourDetails";
import { ConfirmPay } from "./steps/ConfirmPay";

const STEP_COMPONENTS = [
  SelectService,
  ChooseDate,
  SelectTime,
  YourDetails,
  ConfirmPay,
];

export function BookingFlow() {
  const { step, back } = useBookingStore();
  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="mx-auto grid max-w-5xl gap-16 px-6 py-28 md:grid-cols-[1fr_280px] md:px-10">
      <div>
        <div className="mb-10 flex items-center justify-between">
          <StepIndicator current={step} />
          {step > 0 && (
            <button
              onClick={back}
              className="font-sans text-[10px] uppercase tracking-editorial text-foreground-muted hover:text-foreground"
            >
              Nazad
            </button>
          )}
        </div>
        <StepComponent />
      </div>

      <SummaryPanel className="hidden border-l border-white/10 pl-10 md:block" />
      <SummaryPanel className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 px-6 py-4 backdrop-blur md:hidden" />
    </div>
  );
}
