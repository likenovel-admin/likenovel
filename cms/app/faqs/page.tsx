"use client";
import {
  useGetFaqs,
  useGetFaqCategories,
  useAddFaqCategory,
  useEditFaqCategory,
  useDeleteFaqCategory,
} from "@/api/faq";
import FaqsTable from "@/app/faqs/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { calculatePageCount, catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const route = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");

  // 카테고리 관리 상태
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const tabs = [
    { label: "공지사항", value: "/notices" },
    { label: "FAQ", value: "/faqs" },
  ];

  const { data: categories = [] } = useGetFaqCategories();
  const addCategory = useAddFaqCategory();
  const editCategory = useEditFaqCategory();
  const deleteCategory = useDeleteFaqCategory();

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetFaqs({
    page: page,
    count_per_page: item_per_page,
    faq_type: selectedCategory || undefined,
  });

  const handleChangePage = (page: number) => {
    setPage(page);
  };

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["GetFaqCategories"] });
  };

  const handleAddCategory = async () => {
    if (!newCode.trim() || !newName.trim()) {
      return showAlert("알림", "코드와 이름을 모두 입력해주세요.", "확인");
    }
    addCategory.mutate(
      { code: newCode.trim(), name: newName.trim() },
      {
        onSuccess: () => {
          invalidateCategories();
          setIsAdding(false);
          setNewCode("");
          setNewName("");
        },
        onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
      }
    );
  };

  const handleEditCategory = async (code: string) => {
    if (!editingName.trim()) return;
    editCategory.mutate(
      { code, body: { code, name: editingName.trim() } },
      {
        onSuccess: () => {
          invalidateCategories();
          setEditingCode(null);
          setEditingName("");
        },
        onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
      }
    );
  };

  const handleDeleteCategory = async (code: string, name: string) => {
    const result = await confirm({
      title: `"${name}" 카테고리를 삭제하시겠습니까?`,
      text: "해당 카테고리의 FAQ는 '공통'으로 이동됩니다.",
      confirm: "삭제",
      cancel: "취소",
    });
    if (!result.isConfirmed) return;
    deleteCategory.mutate(code, {
      onSuccess: () => {
        invalidateCategories();
        refetch();
        if (selectedCategory === code) setSelectedCategory("");
      },
      onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
    });
  };

  return (
    <>
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="공지 / FAQ" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 px-4">
              {tabs.map((item, index) => (
                <Button
                  key={`tab-${index}`}
                  variant={pathname == item.value ? "default" : "outline"}
                  onClick={() => route.push(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button onClick={() => route.push("/faqs/add")}>+ FAQ 추가</Button>
          </div>

          {/* 카테고리 필터 + 인라인 관리 */}
          <div className="flex items-center gap-2 px-4 flex-wrap">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectedCategory(""); setPage(1); }}
            >
              전체
            </Button>
            {categories.map((cat) => (
              <div key={cat.code} className="flex items-center gap-1">
                {editingCode === cat.code ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 w-[120px] text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleEditCategory(cat.code)}
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditCategory(cat.code)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingCode(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={selectedCategory === cat.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setSelectedCategory(cat.code); setPage(1); }}
                    >
                      {cat.name}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground"
                      onClick={() => { setEditingCode(cat.code); setEditingName(cat.name); }}
                      title="카테고리명 수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteCategory(cat.code, cat.name)}
                      title="카테고리 삭제"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {isAdding ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="코드"
                  className="h-8 w-[80px] text-sm"
                />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="표시명"
                  className="h-8 w-[100px] text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleAddCategory}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setIsAdding(false); setNewCode(""); setNewName(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />카테고리
              </Button>
            )}
          </div>

          <FaqsTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => { refetch(); }}
            currentPage={page || 1}
            pageSize={item_per_page || 8}
            totalCount={data?.total_count ?? 0}
            categories={categories}
          />
          <PaginationControls
            page={page || 1}
            setPage={handleChangePage}
            totalPages={calculatePageCount(
              data?.total_count || 0,
              item_per_page || 8
            )}
          />
          <FullPageLoader isLoading={isLoadingData || isFetching} />
        </div>
      </SidebarInset>
    </>
  );
}
