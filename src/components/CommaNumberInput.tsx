import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
};

export default function CommaNumberInput({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value !== null && !isNaN(value)) {
      setDisplayValue(value.toLocaleString());
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replaceAll(",", "").trim();
    // const num = parseInt(raw, 10);
    const num = parseFloat(raw);

    if (!isNaN(num)) {
      onChange(num);
    } else {
      onChange(null);
    }

    setDisplayValue(e.target.value); // 사용자가 타이핑한 값 그대로 유지
  };

  const handleBlur = () => {
    if (value !== null && !isNaN(value)) {
      setDisplayValue(value.toLocaleString()); // blur 시 포맷 적용
    }
  };

  return (
    <Input
      inputMode="numeric"
      placeholder={placeholder}
      className={className}
      value={displayValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
    />
  );
}
