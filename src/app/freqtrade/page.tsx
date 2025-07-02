import { Header } from "@/components/header";
import FreqtradeSheet from "./FreqtradeSheet";

export default function FreqtradePage() {
  return (
    <>
      <Header title="홈" />
      <div className="flex-1 overflow-auto">
        <FreqtradeSheet></FreqtradeSheet>
      </div>
    </>
  );
}
