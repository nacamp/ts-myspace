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

import { EditableJudgment } from "./page";

const categoryOptions = [
  { value: "FACT", label: "사실" },
  { value: "RESOURCE", label: "자원" },
  { value: "FORECAST", label: "미래" },
  { value: "VALUE", label: "가치" },
  { value: "STAKEHOLDER", label: "관계" },
  { value: "ETC", label: "기타" },
];

export default function JudgmentSection({
  title,
  judgments,
  data,
  onChange,
  onDelete,
  onAdd,
}: {
  title: string;
  judgments: EditableJudgment[];
  data: EditableJudgment[];
  onChange: (
    index: number,
    field: keyof EditableJudgment,
    value: string | number
  ) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="w-1/2 space-y-4">
      <Button onClick={onAdd}> {title} 추가</Button>
      {data.map((j, index) => {
        return (
          <div
            key={index}
            className="flex flex-col border p-4 rounded-xl space-y-2"
          >
            <div className="flex items-start gap-2">
              <Select
                value={j.category ?? ""}
                onValueChange={(value) =>
                  onChange(judgments.indexOf(j), "category", value)
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
                  onChange(
                    judgments.indexOf(j),
                    "weight",
                    parseInt(e.target.value)
                  )
                }
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(judgments.indexOf(j))}
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
                  onChange(judgments.indexOf(j), "why", e.target.value)
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
