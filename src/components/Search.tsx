"use client";

import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FieldType = "input" | "select";

// TODO: 기본값도 들어가면 좋을것 같다.
export interface SearchField {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[]; // select용
}

interface SearchProps {
  title: string;
  fields: SearchField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSearch: () => void;
}

export default function Search({
  title,
  fields,
  values,
  onChange,
  onSearch,
}: SearchProps) {
  return (
    <div className="flex gap-2 items-center">
      {fields.map((field) =>
        field.type === "input" ? (
          <Input
            key={field.key}
            placeholder={field.label}
            value={values[field.key] || ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="w-[150px]"
          />
        ) : (
          <Select
            key={field.key}
            value={values[field.key] || ""}
            onValueChange={(val) =>
              onChange(field.key, val === "__all__" ? "" : val)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={field.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">전체</SelectItem>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}
      <Button className="w-[50px]" onClick={onSearch}>
        Search
      </Button>
    </div>
  );
}
