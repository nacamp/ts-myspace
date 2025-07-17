"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Decision, Judgment, JudgmentCategory } from "@/generated/prisma";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// 입력용 타입 정의
type EditableDecision = Partial<
  Omit<Decision, "id" | "createdAt" | "updatedAt" | "judgments">
>;
type EditableJudgment = Partial<
  Omit<Judgment, "id" | "decisionId" | "decision" | "updatedAt">
>;

const categoryOptions = [
  { value: "FACT", label: "사실" },
  { value: "RESOURCE", label: "자원" },
  { value: "FORECAST", label: "미래" },
  { value: "VALUE", label: "가치" },
  { value: "STAKEHOLDER", label: "관계" },
  { value: "ETC", label: "기타" },
];

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
  const [userDecision, setUserDecision] = useState("");
  const [comment, setComment] = useState("");
  const [autoResult, setAutoResult] = useState<string | null>(null);

  useEffect(() => {
    console.log("here");
    console.log(decisionId);
    if (decisionId) {
      fetch(`/api/decision/${decisionId}`)
        .then((res) => res.json())
        .then((data) => {
          setDecision({
            title: data.title,
            why: data.why,
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
    console.log(field, value);
    setDecision((prev) => ({ ...prev, [field]: value }));
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
    const payload = {
      ...decision,
      // result: autoResult,
      judgments,
    };
    console.log(payload);
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
      window.location.href = "/";
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
            <div className="w-1/2 space-y-4">
              <Button onClick={() => addJudgment("yes")}>YES 추가</Button>
              {/* <div className="text-lg font-semibold">YES 요소</div> */}
              {yesJudgments.map((j, index) => (
                <div
                  key={index}
                  className="flex flex-col border p-4 rounded-xl space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Select
                      value={j.category ?? ""}
                      onValueChange={(value) =>
                        handleJudgmentChange(
                          judgments.indexOf(j),
                          "category",
                          value
                        )
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-[64px]"
                      placeholder="가중치"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={j.weight || 0}
                      onChange={(e) =>
                        handleJudgmentChange(
                          judgments.indexOf(j),
                          "weight",
                          parseInt(e.target.value)
                        )
                      }
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteJudgment(judgments.indexOf(j))}
                    >
                      삭제
                    </Button>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <Textarea
                      className="flex-1"
                      placeholder="고려사항 메모"
                      value={j.why || ""}
                      onChange={(e) =>
                        handleJudgmentChange(
                          judgments.indexOf(j),
                          "why",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="w-1/2 space-y-4">
              <Button onClick={() => addJudgment("no")}>NO 추가</Button>
              {noJudgments.map((j, index) => (
                <div
                  key={index}
                  className="flex flex-col border p-4 rounded-xl space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Select
                      value={j.category ?? ""}
                      onValueChange={(value) =>
                        handleJudgmentChange(
                          judgments.indexOf(j),
                          "category",
                          value
                        )
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      className="w-[64px]"
                      placeholder="가중치"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={j.weight || 0}
                      onChange={(e) =>
                        handleJudgmentChange(
                          judgments.indexOf(j),
                          "weight",
                          parseInt(e.target.value)
                        )
                      }
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteJudgment(judgments.indexOf(j))}
                    >
                      삭제
                    </Button>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <Textarea
                      className="flex-1"
                      placeholder="고려사항 메모"
                      value={j.why || ""}
                      onChange={(e) =>
                        handleJudgmentChange(
                          judgments.indexOf(j),
                          "why",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
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
            {decisionId && (
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
