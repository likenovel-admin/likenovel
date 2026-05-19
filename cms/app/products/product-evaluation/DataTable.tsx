"use client";

import { ICmsProductEvaluationItem } from "@/api/cmsProductEvaluation/dto";
import { useUpsertCmsProductEvaluation } from "@/api/cmsProductEvaluation";
import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isConfirmedEnter } from "@/lib/keyboard";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

interface Props {
  data: ICmsProductEvaluationItem[];
  loading?: boolean;
  onSaveSuccess: () => void;
}

export default function ProductEvaluationTable({
  data,
  loading,
  onSaveSuccess,
}: Props) {
  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({});
  const mutation = useUpsertCmsProductEvaluation();

  const handleScoreChange = (productId: number, value: string) => {
    setScoreInputs((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSave = async (productId: number) => {
    const raw = scoreInputs[productId];
    if (raw === undefined || raw === "") {
      showAlert("알림", "점수를 입력해주세요.", "확인");
      return;
    }
    const score = Number(raw);
    if (isNaN(score) || score < 0 || score > 10 || !Number.isInteger(score)) {
      showAlert("알림", "0~10 사이의 정수를 입력해주세요.", "확인");
      return;
    }

    try {
      await mutation.mutateAsync({
        product_id: productId,
        evaluation_score: score,
      });
      setScoreInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      onSaveSuccess();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const columns: Column[] = [
    { header: "작품 ID", key: "product_id" },
    { header: "작품명", key: "title" },
    { header: "작가명", key: "author_name" },
    {
      header: "현재 점수",
      key: "evaluation_score",
      render: (value: number | null) =>
        value !== null && value !== undefined ? value / 10 : "-",
    },
    {
      header: "평가 여부",
      key: "evaluation_yn",
      render: (value: string | null) => value || "N",
    },
    {
      header: "수정일",
      key: "updated_date",
      render: (value: string | null) =>
        value ? format(new Date(value), "yyyy-MM-dd") : "-",
    },
    {
      header: "점수 입력",
      key: "score_input",
      render: (_: unknown, row: ICmsProductEvaluationItem) => (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={10}
            step={1}
            className="w-[80px]"
            placeholder="0~10"
            value={scoreInputs[row.product_id] ?? ""}
            onChange={(e) => handleScoreChange(row.product_id, e.target.value)}
            onKeyDown={(e) => {
              if (isConfirmedEnter(e)) handleSave(row.product_id);
            }}
          />
          <Button
            size="sm"
            onClick={() => handleSave(row.product_id)}
            disabled={mutation.isPending}
          >
            저장
          </Button>
        </div>
      ),
    },
  ];

  return <CommonTable columns={columns} data={data} loading={loading} />;
}
