"use client";

import {
  useUpdateAlgorithmSection,
  useUpdateAlgorithmSetTopic,
} from "@/api/algorithm";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import {
  IAlgorithmSection,
  IAlgorithmSetTopic,
  IAlgorithmSimilar,
  IAlgorithmUser,
} from "@/types/algorithm";
import { useEffect, useState } from "react";

interface AlgorithmUserTableProps {
  data: IAlgorithmUser[];
  loading?: boolean;
}

export default function AlgorithmUserTable({
  data,
  loading,
}: AlgorithmUserTableProps) {
  const columns: Column[] = [
    {
      header: "User_id",
      key: "user_id",
    },
    {
      header: "이메일",
      key: "email",
    },
    {
      header: "유저타입",
      key: "role_type",
    },
    {
      header: "성별",
      key: "gender",
    },
    {
      header: "연령",
      key: "age",
    },
    {
      header: "feature_basic",
      key: "feature_basic",
    },
    {
      header: "feature_1",
      key: "feature_1",
    },
    {
      header: "feature_2",
      key: "feature_2",
    },
    {
      header: "feature_3",
      key: "feature_3",
    },
    {
      header: "feature_4",
      key: "feature_4",
    },
    {
      header: "feature_5",
      key: "feature_5",
    },
    {
      header: "feature_6",
      key: "feature_6",
    },
    {
      header: "feature_7",
      key: "feature_7",
    },
    {
      header: "feature_8",
      key: "feature_8",
    },
    {
      header: "feature_9",
      key: "feature_9",
    },
    {
      header: "feature_10",
      key: "feature_10",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}

interface AlgorithmSetTopicTableProps {
  data: IAlgorithmSetTopic[];
  loading?: boolean;
  refetch: () => void;
}

export function AlgorithmSetTopicTable({
  data,
  loading,
  refetch,
}: AlgorithmSetTopicTableProps) {
  const updateAlgorithmSetTopic = useUpdateAlgorithmSetTopic();
  const [draftTitles, setDraftTitles] = useState<Record<number, string>>({});

  useEffect(() => {
    setDraftTitles(
      data.reduce<Record<number, string>>((acc, row) => {
        acc[row.id] = row.title;
        return acc;
      }, {})
    );
  }, [data]);

  const columns: Column[] = [
    {
      header: "feature",
      key: "feature",
    },
    {
      header: "target",
      key: "target",
    },
    {
      header: "title",
      key: "title",
      render: (_, row: IAlgorithmSetTopic) => (
        <div className="flex items-center gap-2 min-w-[320px]">
          <Input
            value={draftTitles[row.id] ?? ""}
            onChange={(event) => {
              setDraftTitles((prev) => ({
                ...prev,
                [row.id]: event.target.value,
              }));
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              if (updateAlgorithmSetTopic.isPending) {
                return;
              }
              updateAlgorithmSetTopic.mutate(
                {
                  id: String(row.id),
                  body: {
                    title: draftTitles[row.id] ?? "",
                  },
                },
                {
                  onSuccess: () => {
                    refetch();
                  },
                  onError: (err: any) => {
                    showAlert("오류", catchErrorMessage(err), "확인");
                  },
                }
              );
            }}
          >
            저장
          </Button>
        </div>
      ),
    },
    {
      header: "novel_list",
      key: "novel_list",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={updateAlgorithmSetTopic.isPending} />
    </>
  );
}

interface AlgorithmSectionTableProps {
  data: IAlgorithmSection[];
  loading?: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  refetch: () => void;
  handleChangeFeature: (id: string, field: string, val: string) => void;
}

const optionFeature = [
  {
    value: "default_1",
    label: "default_1",
  },
  {
    value: "default_2",
    label: "default_2",
  },
  {
    value: "default_3",
    label: "default_3",
  },
  {
    value: "default_4",
    label: "default_4",
  },
  {
    value: "feature_basic",
    label: "feature_basic",
  },
  {
    value: "feature_1",
    label: "feature_1",
  },
  {
    value: "feature_2",
    label: "feature_2",
  },
  {
    value: "feature_3",
    label: "feature_3",
  },
  {
    value: "feature_4",
    label: "feature_4",
  },
  {
    value: "feature_5",
    label: "feature_5",
  },
  {
    value: "feature_6",
    label: "feature_6",
  },
  {
    value: "feature_7",
    label: "feature_7",
  },
  {
    value: "feature_8",
    label: "feature_8",
  },
  {
    value: "feature_9",
    label: "feature_9",
  },
  {
    value: "feature_10",
    label: "feature_10",
  },
];

export function AlgorithmSectionTable({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  refetch,
  handleChangeFeature,
}: AlgorithmSectionTableProps) {
  const updateAlgorithmSection = useUpdateAlgorithmSection();
  const handleSaveFeature = (row: IAlgorithmSection) => {
    if (updateAlgorithmSection.isPending) {
      return;
    }
    updateAlgorithmSection.mutate(
      {
        id: row.id + "",
        body: {
          feature: row.feature,
        },
      },
      {
        // onSuccess: () => {
        //   refetch();
        // },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };
  const columns: Column[] = [
    {
      header: "No",
      key: "no",
      render: (_: unknown, __: IAlgorithmSection, index?: number) =>
        totalCount - (currentPage - 1) * pageSize - (index || 0),
    },
    {
      header: "위치",
      key: "position",
    },
    {
      header: "feature",
      key: "feature",
      render: (_, row: IAlgorithmSection) => (
        <Select
          value={row.feature}
          onValueChange={(val) =>
            handleChangeFeature(row.id + "", "feature", val)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="검색 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {optionFeature.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ),
    },
    {
      header: "저장하기",
      key: "save",
      render: (_, row: IAlgorithmSection) => (
        <Button variant="outline" onClick={() => handleSaveFeature(row)}>
          저장
        </Button>
      ),
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={updateAlgorithmSection.isPending} />
    </>
  );
}

interface AlgorithmSimilarTableProps {
  data: IAlgorithmSimilar[];
  loading?: boolean;
}

export function AlgorithmSimilarTable({
  data,
  loading,
}: AlgorithmSimilarTableProps) {
  const columns: Column[] = [
    {
      header: "작품 ID",
      key: "product_id",
    },
    {
      header: "similar_subject_ids",
      key: "similar_subject_ids",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
