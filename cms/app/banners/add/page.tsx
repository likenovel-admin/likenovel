"use client";
import { useAddBanner } from "@/api/banner";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import { FileUpload } from "@/components/common/FileUpload";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { bannerPositions } from "@/constants/banner";
import {
  getMobileBannerImageGuide,
  getPrimaryBannerImageGuide,
  shouldShowMobileBannerImageUpload,
  usesUnifiedBannerImage as isUnifiedBannerImagePosition,
} from "@/lib/bannerImagePolicy";
import { prepareBannerImageForUpload } from "@/lib/imageOptimize";
import { catchErrorMessage, getFileName, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ReactDatePicker from "react-datepicker";

export default function Page() {
  // const isMobile = useIsMobile()
  const router = useRouter();
  const searchParams = useSearchParams();
  const addBanner = useAddBanner();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();
  const listHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/banners?${query}` : "/banners";
  }, [searchParams]);

  const [title, setTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [position, setPosition] = useState<string>(""); // 노출 위치
  const [url, setUrl] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [showOrder, setShowOrder] = useState<string>("");

  const usesUnifiedBannerImage = isUnifiedBannerImagePosition(position);
  const showMobileImageUpload = shouldShowMobileBannerImageUpload(position);

  const handleSubmit = async () => {
    if (
      addBanner.isPending ||
      createUpload.isPending ||
      updateUpload.isPending
    ) {
      return;
    }
    // Validation
    if (!title.trim()) {
      showAlert("알림", "배너명을 입력해주세요.", "확인");
      return;
    }

    if (!startDate || !endDate) {
      showAlert("알림", "노출 기간을 선택해주세요.", "확인");
      return;
    }

    if (!position) {
      showAlert("알림", "노출 위치를 선택해주세요.", "확인");
      return;
    }

    if (!image) {
      showAlert("알림", "배너 이미지를 업로드해주세요.", "확인");
      return;
    }

    if (showMobileImageUpload && !mobileImage) {
      showAlert("알림", "이 위치는 모바일용 이미지를 업로드해주세요.", "확인");
      return;
    }

    const parsedShowOrder = showOrder.trim() ? Number(showOrder) : undefined;
    if (
      parsedShowOrder !== undefined &&
      (!Number.isInteger(parsedShowOrder) || parsedShowOrder < 1)
    ) {
      showAlert("알림", "노출 위치는 1 이상의 정수로 입력해주세요.", "확인");
      return;
    }

    // start upload
    let imageId = null;
    let mobileImageId = null;

    if (image) {
      const uploadImage = await prepareBannerImageForUpload(image);
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: uploadImage.fileName,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        },
      );
      console.log("res", res);
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          file: uploadImage.file,
          file_type: uploadImage.contentType,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        },
      );
      imageId = res.data.fileId;
    }

    if (usesUnifiedBannerImage) {
      mobileImageId = imageId;
    } else if (mobileImage) {
      const uploadMobileImage = await prepareBannerImageForUpload(mobileImage);
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: uploadMobileImage.fileName,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        },
      );
      console.log("mobile res", res);
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          file: uploadMobileImage.file,
          file_type: uploadMobileImage.contentType,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        },
      );
      mobileImageId = res.data.fileId;
    }

    const positionValue = position.includes("main")
      ? position.split("-")[0]
      : position;
    const divisionValue = position.includes("main")
      ? position.split("-")[1]
      : null;
    addBanner.mutate(
      {
        // show_start_date: startDate.toISOString().split("T")[0],
        // show_end_date: endDate.toISOString().split("T")[0],
        show_start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
        show_end_date: endDate ? format(endDate, "yyyy-MM-dd") : "",
        position: positionValue,
        division: divisionValue,
        title: title,
        url: url,
        show_order: parsedShowOrder,
        image_id: imageId || undefined,
        mobile_image_id: usesUnifiedBannerImage
          ? imageId || undefined
          : mobileImageId || undefined,
      },
      {
        onSuccess: () => {
          router.push(listHref);
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      },
    );
  };

  const handleCancel = () => {
    router.push(listHref);
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between">
            <span>배너 추가</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleSubmit}>추가</Button>
            </div>
          </div>
          <hr />
          <Table classNameWrap="static">
            <TableBody>
              <TableRow>
                <TableHead className="require">배너명</TableHead>
                <TableCell>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="배너명을 입력하세요"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">노출 기간</TableHead>
                <TableCell className="flex items-center gap-2">
                  <ReactDatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date ?? undefined)}
                    dateFormat="yyyy-MM-dd"
                    maxDate={endDate}
                    placeholderText="시작일"
                    className="border px-3 py-2 rounded text-sm w-[140px]"
                  />{" "}
                  ~{" "}
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
                <TableHead className="require">노출 위치</TableHead>
                <TableCell>
                  <Select onValueChange={(value) => setPosition(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="위치를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {bannerPositions.map((pos) => (
                          <SelectItem key={pos.value} value={pos.value}>
                            {pos.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>노출 위치</TableHead>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={showOrder}
                      onChange={(e) => setShowOrder(e.target.value)}
                      placeholder="마지막"
                      className="w-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      같은 구좌 안에서 몇 번째로 보여줄지 입력합니다. 비워두면
                      마지막에 배치됩니다.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">URL</TableHead>
                <TableCell>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="배너 클릭 시 이동할 URL"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">배너 이미지</TableHead>
                <TableCell>
                  <FileUpload
                    fileName={getFileName(image || "", "")}
                    onFileChange={setImage}
                    accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                  />
                  <br />
                  {getPrimaryBannerImageGuide(position)}
                </TableCell>
              </TableRow>
              {image && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt="배너 미리보기"
                      className="max-h-[180px] rounded border"
                    />
                  </TableCell>
                </TableRow>
              )}
              {showMobileImageUpload && (
                <>
                  <TableRow>
                    <TableHead>모바일 배너 이미지</TableHead>
                    <TableCell>
                      <FileUpload
                        fileName={getFileName(mobileImage || "", "")}
                        onFileChange={setMobileImage}
                        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                      />
                      <br />
                      {getMobileBannerImageGuide(position)}
                    </TableCell>
                  </TableRow>

                  {mobileImage && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <img
                          src={URL.createObjectURL(mobileImage)}
                          alt="모바일 배너 미리보기"
                          className="max-h-[120px] rounded border"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        <FullPageLoader
          isLoading={
            addBanner.isPending ||
            createUpload.isPending ||
            updateUpload.isPending
          }
        />
      </SidebarInset>
    </>
  );
}
