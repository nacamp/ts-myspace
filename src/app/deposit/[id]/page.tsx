import { Header } from "@/components/header";
import TransactionSheet from "./TransactionSheet";

type Props = {
  params: { id: string };
};
//https://velog.io/@hunter_joe99/NEXTJS-params-Error
export default  async function TransactionPage({ params }: Props) {
  const {id} = await params
  console.log(id);
  return (
    <>
      <Header title="홈" />
      <div className="flex-1 overflow-auto">
        <TransactionSheet></TransactionSheet>
      </div>
    </>
  );
}