"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toDateFromYYYYMMDD, toYYYYMMDDfromDate } from "@/lib/utils";

import { Decision, Prisma } from "@/generated/prisma";
import CommaNumberInput from "@/components/CommaNumberInput";
type DecisionRowProps = {
  row: Partial<Decision>;
  isNew?: boolean;
  index?: number;
  onChange?: (row: Partial<Decision>) => void;
};

type DecisionForm = Partial<Decision> & {
  createdAtInput?: string;
  // interestInput?: string;
};

export default function DecisionRow({
  row,
  isNew = false,
  index,
  onChange,
}: DecisionRowProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [form, setForm] = useState<DecisionForm>({
    ...row,
    createdAtInput: row.createdAt ? toYYYYMMDDfromDate(row.createdAt) : "",
  });

  return (
    <div className="flex items-center gap-4 py-0 my-0">
      <span className="w-[50px] text-right text-muted-foreground">
        {index ?? ""}
      </span>

      <span className="w-[100px]"> {form.createdAtInput} </span>

      <span className="flex-1"> {form.title ?? ""} </span>

      <Button
        className="w-[50px]"
        onClick={() => form.id && router.push(`/decision/${form.id}`)}
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
