"use client";

import { useAddEvent } from "@/api/event";
import { Editor } from "@/components/common/Editor";
import FullPageLoader from "@/components/common/FullPageLoader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { ImageIcon, ToggleRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import {
  catchErrorMessage,
  getFileName,
  parseProductIds,
  showAlert,
} from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/ui/page-header";
import { FileUpload } from "@/components/common/FileUpload";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import { format } from "date-fns";

const types = [
  { value: "view-3-times", label: "3화 감상" },
  { value: "add-comment", label: "댓글 등록" },
  { value: "add-product", label: "작품 등록" },
  { value: "etc", label: "그 외" },
];

const eventRewards = [
  { value: "ticket", label: "이벤트 대여권" },
  { value: "cash", label: "캐시" },
];

export default function Page() {
  const router = useRouter();
  const addEvent = useAddEvent();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();

  // State
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [type, setType] = useState("");
  const [eventProducts, setEventProducts] = useState("");
  const [rewardType, setRewardType] = useState("");
  const [rewardAmount, setRewardAmount] = useState<number>();
  const [rewardMaxPeople, setRewardMaxPeople] = useState<number>();

  const [showThumbnail, setShowThumbnail] = useState(true);
  const [showDetailImage, setShowDetailImage] = useState(true);
  const [showProduct, setShowProduct] = useState(true);
  const [showInfo, setShowInfo] = useState(true);

  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [detailImage, setDetailImage] = useState<File | null>(null);

  const [accountName, setAccountName] = useState("");
  const [exposedProducts, setExposedProducts] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Condition flags
  const isEventProductDisabled = type === "add-product" || type === "etc";
  const isRewardSectionDisabled = type === "etc";

  const handleSubmit = async () => {
    if (
      updateUpload.isPending ||
      addEvent.isPending ||
      createUpload.isPending
    ) {
      return;
    }
    if (!title.trim())
      return showAlert("알림", "이벤트명을 입력해주세요.", "확인");
    if (!startDate || !endDate)
      return showAlert("알림", "이벤트 기간을 선택해주세요.", "확인");
    if (!type) return showAlert("알림", "이벤트 종류를 선택해주세요.", "확인");
    if (!isEventProductDisabled && !eventProducts.trim()) {
      return showAlert("알림", "이벤트 적용 작품을 입력해주세요.", "확인");
    }
    if (!isRewardSectionDisabled) {
      if (!rewardType)
        return showAlert("알림", "보상 종류를 선택해주세요.", "확인");
      if (!rewardAmount || rewardAmount < 0)
        return showAlert("알림", "증정 갯수를 입력해주세요.", "확인");
      if (!rewardMaxPeople || rewardMaxPeople < 0)
        return showAlert("알림", "최대 인원을 입력해주세요.", "확인");
    }

    if (!thumbnailImage) {
      return showAlert("알림", "썸네일 이미지를 등록해주세요.", "확인");
    }
    if (!detailImage) {
      return showAlert("알림", "상세 이미지를 등록해주세요.", "확인");
    }

    // start upload
    let thumbnailImageId = null;
    if (thumbnailImage) {
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: getFileName(thumbnailImage),
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      console.log("res", res);
      const formData = new FormData();
      formData.append("file", thumbnailImage);
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          // file: formData,
          file: thumbnailImage,
          file_type: thumbnailImage.type,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      thumbnailImageId = res.data.fileId;
    }

    let detailImageId = null;
    if (detailImage) {
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: getFileName(detailImage),
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      console.log("res", res);
      const formData = new FormData();
      formData.append("file", detailImage);
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          // file: formData,
          file: detailImage,
          file_type: detailImage.type,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      detailImageId = res.data.fileId;
    }

    await addEvent.mutateAsync(
      {
        title,
        type,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : "",
        target_product_ids: parseProductIds(eventProducts),
        reward_type: isRewardSectionDisabled ? undefined : rewardType,
        reward_amount: rewardAmount || 0,
        reward_max_people: rewardMaxPeople || 0,
        show_yn_thumbnail_img: showThumbnail ? "Y" : "N",
        show_yn_detail_img: showDetailImage ? "Y" : "N",
        show_yn_product: showProduct ? "Y" : "N",
        show_yn_information: showInfo ? "Y" : "N",
        thumbnail_image_id: thumbnailImageId || undefined, // TODO: upload to get ID
        detail_image_id: detailImageId || undefined, // TODO: upload to get ID
        account_name: accountName,
        product_ids: parseProductIds(exposedProducts),
        information: infoMessage,
      },
      {
        onSuccess: () => router.push("/events"),
        onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
      }
    );
  };

  const handleCancel = () => router.push("/events");

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="" />

      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex justify-between">
          <span>이벤트 등록</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button onClick={handleSubmit}>추가</Button>
          </div>
        </div>
        <hr />
        <h1>기본 정보</h1>
        <Table classNameWrap="static">
          <TableBody>
            <TableRow>
              <TableHead className="require">이벤트명</TableHead>
              <TableCell>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="require">이벤트 기간</TableHead>
              <TableCell className="flex items-center gap-2">
                <ReactDatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date ?? undefined)}
                  dateFormat="yyyy-MM-dd"
                  maxDate={endDate}
                  placeholderText="시작일"
                  className="border px-3 py-2 rounded text-sm w-[140px]"
                />
                ~
                <ReactDatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date ?? undefined)}
                  dateFormat="yyyy-MM-dd"
                  minDate={startDate}
                  placeholderText="종료일"
                  className="border px-3 py-2 rounded text-sm w-[140px]"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="require">이벤트 종류</TableHead>
              <TableCell>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="이벤트 종류 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="require">이벤트 작품 등록</TableHead>
              <TableCell>
                <Input
                  disabled={isEventProductDisabled}
                  placeholder="작품 ID 입력 (예: 1,2,3)"
                  value={eventProducts}
                  onChange={(e) => setEventProducts(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="require">이벤트 보상</TableHead>
              <TableCell className="flex items-center gap-2">
                <div>
                  <span>보상 종류</span>
                  <Select
                    value={rewardType}
                    onValueChange={setRewardType}
                    disabled={isRewardSectionDisabled}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="보상 종류 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventRewards.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span>증정 갯수</span>
                  <Input
                    type="number"
                    disabled={isRewardSectionDisabled}
                    value={rewardAmount ?? ""}
                    onChange={(e) => setRewardAmount(+e.target.value)}
                  />
                </div>
                <div>
                  <span>최대 인원</span>
                  <Input
                    type="number"
                    disabled={isRewardSectionDisabled}
                    value={rewardMaxPeople ?? ""}
                    onChange={(e) => setRewardMaxPeople(+e.target.value)}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <h1>이벤트 페이지</h1>
        <Table classNameWrap="static">
          <TableBody>
            <TableRow>
              <TableHead className="require">노출 여부 설정</TableHead>
              <TableCell className="flex items-center gap-4">
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    id="airplane-mode"
                    checked={showThumbnail}
                    onCheckedChange={() => setShowThumbnail(!showThumbnail)}
                  />
                  <span>썸네일 이미지</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    id="airplane-mode"
                    checked={showDetailImage}
                    onCheckedChange={() => setShowDetailImage(!showDetailImage)}
                  />
                  <span>상세 이미지</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    id="airplane-mode"
                    checked={showProduct}
                    onCheckedChange={() => setShowProduct(!showProduct)}
                  />
                  <span>작품 구좌</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    id="airplane-mode"
                    checked={showInfo}
                    onCheckedChange={() => setShowInfo(!showInfo)}
                  />
                  <span>안내 문구</span>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="require">썸네일 이미지</TableHead>
              <TableCell>
                {/* <Input
                  type="file"
                  // disabled={!showThumbnail}
                  onChange={(e) =>
                    setThumbnailImage(e.target.files?.[0] || null)
                  }
                /> */}
                <FileUpload
                  fileName={getFileName(thumbnailImage || "", "")}
                  onFileChange={setThumbnailImage}
                />
                <br />
                PC: 1080x347 (1120x360), 포멧: jpg|png|gif
              </TableCell>
            </TableRow>
            {thumbnailImage && (
              <TableRow>
                <TableCell colSpan={2}>
                  <img
                    src={
                      typeof thumbnailImage === "string"
                        ? thumbnailImage
                        : URL.createObjectURL(thumbnailImage)
                    }
                    alt="배너 미리보기"
                    className="max-h-[180px] rounded border"
                  />
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableHead className="require">상세 이미지</TableHead>
              <TableCell>
                {/* <Input
                  type="file"
                  // disabled={!showDetailImage}
                  onChange={(e) => setDetailImage(e.target.files?.[0] || null)}
                /> */}
                <FileUpload
                  fileName={getFileName(detailImage || "", "")}
                  onFileChange={setDetailImage}
                />
                <br />
                PC: 1080x347 (1120x360), 포멧: jpg|png|gif
              </TableCell>
            </TableRow>
            {detailImage && (
              <TableRow>
                <TableCell colSpan={2}>
                  <img
                    src={
                      typeof detailImage === "string"
                        ? detailImage
                        : URL.createObjectURL(detailImage)
                    }
                    alt="배너 미리보기"
                    className="max-h-[180px] rounded border"
                  />
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableHead className="require">구좌명</TableHead>
              <TableCell>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="require">노출 작품</TableHead>
              <TableCell>
                <Input
                  value={exposedProducts}
                  onChange={(e) => setExposedProducts(e.target.value)}
                  placeholder="작품 ID 입력 (예: 1,2,3)"
                />
              </TableCell>
            </TableRow>
            <TableRow className="h-[100px]">
              <TableHead className="require">안내 문구</TableHead>
              <TableCell>
                <Editor
                  value={infoMessage}
                  setValue={setInfoMessage}
                  placeholder="안내 문구를 입력해주세요..."
                  preservePlainTextNewlines
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <FullPageLoader
        isLoading={
          addEvent.isPending || createUpload.isPending || updateUpload.isPending
        }
      />
    </SidebarInset>
  );
}
