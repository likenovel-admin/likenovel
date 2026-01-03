import {
  useAddKeyword,
  useGetKeywordCategories,
  useEditKeyword,
} from "@/api/keyword";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { IKeyword } from "@/types/keyword";
import { useEffect, useMemo, useState } from "react";

interface DocumentsPopupProps {
  close: () => void;
  refetch: () => void;
  data: IKeyword | null;
}

const AddKeywordPopup = (props: DocumentsPopupProps) => {
  const [tagName, setTagName] = useState("");
  const [tagType, setTagType] = useState("");
  const { data: dataCategories } = useGetKeywordCategories();
  const addKeyword = useAddKeyword();
  const editKeyword = useEditKeyword();

  useEffect(() => {
    if (props.data) {
      setTagName(props.data.keyword_name);
      setTagType(props.data.category_id + "");
    }
  }, [props.data]);

  const categoryOptions = useMemo(() => {
    if (dataCategories) {
      return dataCategories.map((item) => {
        return {
          label: item.category_name,
          value: item.category_id + "",
        };
      });
    }
    return [];
  }, [dataCategories]);

  const handleSave = async () => {
    if (addKeyword.isPending || editKeyword.isPending) return;

    if (!tagName.trim()) {
      showAlert("알림", "태그명을 입력해주세요.", "확인");
      return;
    }

    if (!tagType) {
      showAlert("알림", "태그 종류를 선택해주세요.", "확인");
      return;
    }

    if (props.data) {
      editKeyword.mutate(
        {
          id: props.data.keyword_id + "",
          body: { keyword_name: tagName, category_id: Number(tagType) },
        },
        {
          onSuccess: () => {
            props.close();
            props.refetch();
          },
          onError: (err: any) => {
            showAlert("오류", catchErrorMessage(err), "확인");
          },
        }
      );
      return;
    }
    addKeyword.mutate(
      { keyword_name: tagName, category_id: Number(tagType) },
      {
        onSuccess: () => {
          props.close();
          props.refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <div className="documents-popup-wrapper">
      <div className="documents-popup shadow">
        <div className="documents-popup-main">
          <h1>{props.data ? "태그 수정" : "태그 생성"}</h1>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead>태그명</TableHead>
                <TableCell>
                  <Input
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>태그 종류</TableHead>
                <TableCell>
                  <Select
                    value={tagType}
                    onValueChange={(val) => setTagType(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="검색 기준" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectGroup>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="documents-popup-buttons">
            <Button variant="outline" onClick={handleSave}>
              {props.data ? "수정" : "생성"}
            </Button>
            <Button variant="outline" onClick={props.close}>
              취소
            </Button>
          </div>
        </div>
      </div>
      <FullPageLoader
        isLoading={addKeyword.isPending || editKeyword.isPending}
      />
    </div>
  );
};

export { AddKeywordPopup };
