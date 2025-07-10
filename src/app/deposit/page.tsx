import { Header } from "@/components/header";
import DepositSheet from "./DepositSheet";

export default function DepositPage() {
  return (
    <>
      <Header title="홈" />
      <div className="flex-1 overflow-auto">
        <DepositSheet></DepositSheet>
      </div>
    </>
  );
}