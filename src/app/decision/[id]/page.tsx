"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { Decision, Judgment, JudgmentCategory } from "@/generated/prisma";
import { toDateFromYYYYMMDD, toYYYYMMDDfromDate } from "@/lib/utils";

import JudgmentSection from "./JudgmentSection";

// 입력용 타입 정의
export type EditableDecision = Partial<
  Omit<Decision, "id" | "updatedAt" | "judgments">
> & {
  createdAtInput?: string;
};

export type EditableJudgment = Partial<
  Omit<Judgment, "id" | "decisionId" | "decision" | "updatedAt">
>;

const CATEGORY_TIPS: Record<string, string[]> = {
  사실: [
    "시장 수요 / 성장률",
    "경쟁사 수 / 점유율",
    "제품 원가 / 마진율",
    "사용자 반응 / 테스트 결과",
    "실적 데이터 / KPI 달성도",
    "유사 사례 분석",
    "법률/규제 요건 충족 여부",
  ],
  자원: [
    "예산 여력 / 투자금",
    "인력 구성 / 가용 인력",
    "기술 수준 / 보유 솔루션",
    "시간 (마감 시한, 리드 타임)",
    "업무 경험 / 실행력",
    "실행 난이도",
    "기회비용",
  ],
  미래: [
    "향후 수요 예측",
    "예상 수익 / 손익분기점",
    "정책 변화 가능성",
    "기술 변화 트렌드",
    "시장 진입 시기",
    "불확실성 수준 / 리스크 다양성",
    "외부 위기 변수 (환율, 금리, 경기 등)",
  ],
  가치: [
    "장기 목표와의 정렬성",
    "개인의 성장과 학습 가능성",
    "회사의 미션·비전과 부합 여부",
    "사회적 가치 (ESG 등)",
    "조직 문화와의 일치도",
    "윤리적 기준 / 원칙",
    "의미 부여 / 자부심 여부",
  ],
  관계: [
    "고객 니즈 반영 정도",
    "팀 내 갈등/협력 가능성",
    "상사의 의도 / 조직 전략",
    "파트너사 협력 가능성",
    "가족/지인 의견 또는 지원 여부",
    "기존 관계 유지/훼손 여부",
  ],
};

export default function DecisionInputForm() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const decisionId = parseInt(params.id, 10);
  const [decision, setDecision] = useState<EditableDecision>({
    title: "",
    why: "",
    result: null,
  });
  const [judgments, setJudgments] = useState<EditableJudgment[]>([]);
  const [autoResult, setAutoResult] = useState<string | null>(null);

  useEffect(() => {
    if (decisionId) {
      fetch(`/api/decision/${decisionId}`)
        .then((res) => res.json())
        .then((data) => {
          setDecision({
            title: data.title,
            why: data.why,
            createdAt: new Date(data.createdAt),
            createdAtInput: data.createdAt
              ? toYYYYMMDDfromDate(new Date(data.createdAt))
              : "",
            result: data.result,
          });
          setJudgments(data.judgments);
        })
        .catch((err) => {
          console.log(err);
          //setLoadError("결정을 불러오는 데 실패했습니다.");
        });
    }
  }, [decisionId]);

  const handleDecisionChange = (
    field: keyof EditableDecision,
    value: string
  ) => {
    setDecision((prev) => {
      if (field === "createdAtInput") {
        const date = toDateFromYYYYMMDD(value);
        return { ...prev, createdAt: date, createdAtInput: value };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleJudgmentChange = (
    index: number,
    field: keyof EditableJudgment,
    value: string | number
  ) => {
    const updated = [...judgments];

    if (field === "weight") {
      updated[index].weight = Number(value);
    } else if (field === "category") {
      updated[index].category = value as JudgmentCategory;
    } else if (field === "why" || field === "verdict" || field === "result") {
      updated[index][field] = value as string;
    }

    setJudgments(updated);
  };

  const addJudgment = (verdict: "yes" | "no") => {
    setJudgments([
      ...judgments,
      { verdict, category: "ETC", weight: 0, why: "" },
    ]);
  };

  const deleteJudgment = (indexToDelete: number) => {
    setJudgments(judgments.filter((_, i) => i !== indexToDelete));
  };

  const calculateResult = () => {
    const total = judgments.reduce((sum, j) => sum + (j.weight || 0), 0);
    const yesTotal = judgments.reduce(
      (sum, j) => sum + (j.verdict === "yes" ? j.weight || 0 : 0),
      0
    );
    const percentage = (yesTotal / total) * 100;

    if (percentage >= 70) setAutoResult("진행");
    else if (percentage >= 50) setAutoResult("검토");
    else setAutoResult("보류");
  };

  const saveDecision = async () => {
    const { createdAtInput, ...decisionToSend } = decision;
    const payload = {
      ...decisionToSend,
      judgments,
    };
    const method = decisionId ? "PUT" : "POST";
    const url = decisionId ? `/api/decision/${decisionId}` : "/api/decision";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) alert(decisionId ? "수정 완료" : "저장 완료");
    else alert("저장 실패");
  };

  const deleteDecision = async () => {
    if (!decisionId) return;
    const confirm = window.confirm("정말로 이 결정을 삭제하시겠습니까?");
    if (!confirm) return;

    const res = await fetch(`/api/decision/${decisionId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("삭제 완료");
      window.location.href = "/decision";
    } else {
      alert("삭제 실패");
    }
  };

  const yesJudgments = judgments.filter((j) => j.verdict === "yes");
  const noJudgments = judgments.filter((j) => j.verdict === "no");

  return (
    <div className="flex flex-col gap-3 p-6">
      <Button className="w-[50px]" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <Card className="w-full mx-auto p-6 space-y-4">
        <CardContent className="space-y-4">
          <Input
            className="w-[100px]"
            placeholder="날짜"
            value={decision.createdAtInput || ""}
            onChange={(e) =>
              handleDecisionChange("createdAtInput", e.target.value)
            }
          />

          <Input
            placeholder="결정할 질문을 입력하세요"
            value={decision.title || ""}
            onChange={(e) => handleDecisionChange("title", e.target.value)}
          />
          <Textarea
            placeholder="질문의 배경이나 이유"
            value={decision.why || ""}
            onChange={(e) => handleDecisionChange("why", e.target.value)}
          />

          <div className="flex space-x-4">
            <JudgmentSection
              title="YES"
              judgments={judgments}
              data={yesJudgments}
              onChange={handleJudgmentChange}
              onDelete={deleteJudgment}
              onAdd={() => addJudgment("yes")}
            />
            <JudgmentSection
              title="NO"
              judgments={judgments}
              data={noJudgments}
              onChange={handleJudgmentChange}
              onDelete={deleteJudgment}
              onAdd={() => addJudgment("no")}
            />
          </div>

          <Button onClick={calculateResult}>결과 계산</Button>
          {autoResult && (
            <div className="text-lg font-semibold">자동 결론: {autoResult}</div>
          )}

          <Textarea
            placeholder="내가 실제 내린 결론"
            value={decision.result || ""}
            onChange={(e) => handleDecisionChange("result", e.target.value)}
          />
          <div className="flex space-x-4">
            <Button onClick={saveDecision}>
              {decisionId ? "결정 수정" : "결정 저장하기"}
            </Button>
            {decisionId > 0 && (
              <Button variant="destructive" onClick={deleteDecision}>
                결정 삭제
              </Button>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="text-lg font-semibold">카테고리별 참고 요소</div>
            {Object.entries(CATEGORY_TIPS).map(([category, items]) => (
              <div key={category}>
                <div className="font-medium">✅ {category}</div>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
