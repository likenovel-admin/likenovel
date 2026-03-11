"use client";
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
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Popup from "./components/popup";
import {
  getDownloadProducts,
  useDeleteProduct,
  useGetProductCpCompany,
  useGetProductDetail,
  useGetProductGenre,
  useUpdateProduct,
} from "@/api/product";
import { IProduct } from "@/types/product";
import PageHeader from "@/components/ui/page-header";
import FullPageLoader from "@/components/common/FullPageLoader";
import {
  catchErrorMessage,
  confirm,
  isPositiveIntegerInput,
  isPositiveDecimalInput,
  showAlert,
} from "@/lib/utils";
import { IUpdateProductRequest } from "@/api/product/dto";
import { downloadExcel } from "@/lib/excelDownload";
import { format } from "date-fns";
import { useProfile } from "@/hooks/useProfile";

interface PropsType {
  product: IProduct | undefined;
}

const statusCodes = [
  { value: "ongoing", label: "연재중" },
  { value: "rest", label: "휴재중" },
  { value: "end", label: "완결" },
  // { value: "stop", label: "연재중지" },
];

const ratingsCodes = [
  { value: "all", label: "전체" },
  { value: "adult", label: "성인용" },
  // { value: "19", label: "19세 이용가" },
  // { value: "stop", label: "연재중지" },
];

function AdminPage({ product }: PropsType) {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { data: genres } = useGetProductGenre();
  const { data: cpsData } = useGetProductCpCompany();

  const [isLoading, setIsLoading] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showBlindConfirmPopup, setShowBlindConfirmPopup] = useState(false);
  const [title, setTitle] = useState("");
  const [ratingsCode, setRatingsCode] = useState("");
  const [primaryGenreId, setPrimaryGenreId] = useState<number>(0);
  const [subGenreId, setSubGenreId] = useState<number>(0);
  const [statusCode, setStatusCode] = useState("연재중");
  const [uci, setUci] = useState("");
  const [isbn, setIsbn] = useState("");
  const [seriesPrice, setSeriesPrice] = useState<string>("");
  const [singlePrice, setSinglePrice] = useState<string>("");
  const [cpId, setCpId] = useState<string>("");
  const [monopolyYn, setMonopolyYn] = useState<boolean>(false);
  const [cpContractPrice, setCpContractPrice] = useState<string>("");
  const [cpAuthorProfit, setCpAuthorProfit] = useState<string>("");
  const [isBlind, setIsBlind] = useState(false);

  const primaryGenreList = useMemo(
    () =>
      genres
        ? genres
            .filter((genre) => genre.major_genre_yn === "Y")
            .map((item) => ({
              value: item.keyword_id + "",
              label: item.keyword_name,
            }))
        : [],
    [genres]
  );
  const subGenreList = useMemo(
    () =>
      genres
        ? genres
            .filter((genre) => genre.major_genre_yn === "Y")
            .map((item) => ({
              value: item.keyword_id + "",
              label: item.keyword_name,
            }))
        : [],
    [genres]
  );
  const cpList = useMemo(
    () =>
      cpsData
        ? cpsData.map((item) => ({
            value: item.company_name + "",
            label: item.company_name,
          }))
        : [],
    [cpsData]
  );

  useEffect(() => {
    if (!product) return;
    setTitle(product.title ?? "");
    setRatingsCode(product.ratings_code ?? "");
    setPrimaryGenreId(product.primary_genre_id ?? 0);
    setSubGenreId(product.sub_genre_id ?? 0);
    setStatusCode(product.status_code ?? "");
    setUci(product.uci ?? "");
    setIsbn(product.isbn ?? "");
    setSeriesPrice((product.series_regular_price ?? "") + "");
    setSinglePrice((product.single_regular_price ?? "") + "");
    setCpId(product.cp_company_name ?? "");
    setCpContractPrice((product.cp_contract_price ?? "") + "");
    setCpAuthorProfit(
      (product.cp_author_profit ? product.cp_author_profit * 100 : "") + ""
    );
    setMonopolyYn(product.monopoly_yn === "Y" ? true : false);
    setIsBlind(product.blind_yn === "Y" ? true : false);
  }, [product]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadProducts,
      params: {},
      headers: [
        "작품ID",
        "작품명",
        "작가명",
        "회차수",
        "유형",
        "담당CP",
        "작품 등록일",
        "유료 전환일",
        "ISBN",
        "UCI",
        "연재 상태",
        "연령등급",
        "1차 장르",
        "2차 장르",
        "판매 형태",
        "독점 여부",
      ],
      fields: [
        "product_id",
        "title",
        "author_nickname",
        "count_episode",
        (row: IProduct) => (row.price_type === "paid" ? "유료" : "무료"),
        "cp_company_name",
        (row: IProduct) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        (row: IProduct) =>
          row.paid_open_date
            ? format(new Date(row.paid_open_date), "yyyy.MM.dd")
            : "-",
        "isbn",
        "uci",
        "status_code",
        "ratings_code",
        "primary_genre",
        "sub_genre",
        "price_type",
        (row: IProduct) => (row.monopoly_yn === "Y" ? "예" : "비독점"),
      ],
      filename: "작품 리스트",
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  const handleDelete = async () => {
    if (deleteProduct.isPending) {
      return;
    }
    if (!product?.product_id) return;
    const result = await confirm({
      title: "작품 정보를 삭제하시겠습니까?",
      text: "삭제된 정보는 복구할 수 없습니다. 계속 진행하시겠습니까?",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteProduct.mutate((product?.product_id || "") + "", {
      onSuccess: () => {
        route.back();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleSubmit = async () => {
    if (updateProduct.isPending) return;

    // Basic validation
    if (!title.trim()) {
      showAlert("알림", "작품명을 입력해주세요.", "확인");
      return;
    }
    // if (!uci.trim()) {
    //   showAlert("알림", "UCI를 입력해주세요.", "확인");
    //   return;
    // }
    // if (!isbn.trim()) {
    //   showAlert("알림", "ISBN을 입력해주세요.", "확인");
    //   return;
    // }

    // CP validation: if cpContractPrice or cpAuthorProfit is entered, cpId must have value
    if ((cpContractPrice.trim() || cpAuthorProfit.trim()) && !cpId.trim()) {
      showAlert(
        "알림",
        "계약 금액 또는 작가 정산비를 입력한 경우 CP사를 선택해주세요.",
        "확인"
      );
      return;
    }

    const payload: IUpdateProductRequest = {
      title,
      primary_genre_id: primaryGenreId,
      sub_genre_id:
        typeof subGenreId === "string" || subGenreId === 0
          ? undefined
          : subGenreId,
      status_code: statusCode,
      ratings_code: ratingsCode,
      uci,
      isbn,
      series_regular_price: Number(seriesPrice || 0),
      single_regular_price: Number(singlePrice || 0),
      cp_company_name: cpId || undefined,
      monopoly_yn: monopolyYn === true ? "Y" : "N",
      open_yn: isBlind ? "N" : "Y",
      cp_offered_price: Number(cpContractPrice || 0) || undefined,
      cp_settlement_rate: Number(cpAuthorProfit || 0) || undefined,
      // cp_author_profit: cpAuthorProfit,
      // cp_contract_price: cpContractPrice,
    };

    updateProduct.mutate(
      { id: (product?.product_id || "") + "", body: payload },
      {
        onSuccess: () => route.back(),
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="작품 정보 수정"
          parent="작품 정보 수정"
          child="작품 리스트"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>{product?.title} 작품 정보</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelPopup(true)}
              >
                취소
              </Button>
              <Button onClick={handleSubmit}>작품수정</Button>
            </div>
          </div>
          <hr />
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="require">작품명</TableHead>
                <TableCell>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">연령등급</TableHead>
                <TableCell className="flex items-center gap-2">
                  {ratingsCodes.map((option) => (
                    <Button
                      onClick={() => setRatingsCode(option.value)}
                      variant={
                        ratingsCode === option.value ? "default" : "outline"
                      }
                      key={option.value}
                    >
                      {option.label}
                    </Button>
                  ))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">장르</TableHead>
                <TableCell className="flex items-center gap-2">
                  <Select
                    value={primaryGenreId + ""}
                    onValueChange={(val) => setPrimaryGenreId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {primaryGenreList.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    value={subGenreId + ""}
                    onValueChange={(val) => setSubGenreId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {subGenreList.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">연재 상태</TableHead>
                <TableCell className="flex items-center gap-2">
                  {statusCodes.map((option) => (
                    <Button
                      onClick={() => setStatusCode(option.value)}
                      variant={
                        statusCode === option.value ? "default" : "outline"
                      }
                      key={option.value}
                    >
                      {option.label}
                    </Button>
                  ))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="">UCI</TableHead>
                <TableCell>
                  <Input
                    value={uci}
                    onChange={(e) => setUci(e.target.value)}
                    placeholder="작품의 UCI를 입력하세요"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="">ISBN</TableHead>
                <TableCell>
                  <Input
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="작품의 ISBN을 입력하세요"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">연재 가격</TableHead>
                <TableCell>
                  <Input
                    // type="number"
                    value={seriesPrice}
                    // onChange={(e) => setSeriesPrice(Number(e.target.value))}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isPositiveIntegerInput(value) || value === "") {
                        setSeriesPrice(value === "" ? "" : Number(value) + "");
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">단행본 가격</TableHead>
                <TableCell>
                  <Input
                    // type="number"
                    value={singlePrice}
                    // onChange={(e) => setSinglePrice(Number(e.target.value))}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isPositiveIntegerInput(value) || value === "") {
                        setSinglePrice(value === "" ? "" : Number(value) + "");
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="">CP사 설정</TableHead>
                <TableCell>
                  <Select
                    value={cpId + ""}
                    onValueChange={(val) => setCpId(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="설정 안함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cpList.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    // type="number"
                    value={cpAuthorProfit}
                    step="any"
                    // onChange={(e) => setCpAuthorProfit(Number(e.target.value))}
                    // type="number"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isPositiveDecimalInput(value) || value === "") {
                        setCpAuthorProfit(value === "" ? "" : value);
                      }
                    }}
                    placeholder="작가 정산비( ex : 0.7 )"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    // type="number"
                    value={cpContractPrice}
                    step="any"
                    // onChange={(e) => setCpContractPrice(Number(e.target.value))}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isPositiveDecimalInput(value) || value === "") {
                        setCpContractPrice(value === "" ? "" : value);
                      }
                    }}
                    placeholder="계약 금액"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">독점 여부</TableHead>
                <TableCell>
                  <Input
                    type="checkbox"
                    className="w-[36px]"
                    checked={monopolyYn}
                    onChange={() => setMonopolyYn(!monopolyYn)}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">작품 블라인드</TableHead>
                <TableCell>
                  <Input
                    type="checkbox"
                    className="w-[36px]"
                    checked={isBlind}
                    onChange={() => {
                      if (isBlind) {
                        setIsBlind(false);
                      } else {
                        setShowBlindConfirmPopup(true);
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleDownloadExcel}>
              다운로드
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              작품 삭제
            </Button>
          </div>
        </div>
        <FullPageLoader
          isLoading={
            updateProduct.isPending || isLoading || deleteProduct.isPending
          }
        />
      </SidebarInset>
      {showCancelPopup && (
        <Popup
          title="작품 정보 수정을 취소할까요?"
          content="작성하신 내용은 저장되지 않습니다."
          leftButton="돌아가기"
          rightButton="취소하기"
          onClickLeftButton={() => setShowCancelPopup(false)}
          onClickRightButton={() => route.back()}
        />
      )}
      {showBlindConfirmPopup && (
        <Popup
          title="정말로 작품을 블라인드 처리할까요?"
          content="블라인드 처리된 작품은 사용자에게 노출되지 않습니다."
          leftButton="돌아가기"
          rightButton="처리하기"
          onClickLeftButton={() => setShowBlindConfirmPopup(false)}
          onClickRightButton={() => {
            setShowBlindConfirmPopup(false);
            setIsBlind(true);
          }}
        />
      )}
    </>
  );
}

function AuthorPage({ product }: PropsType) {
  const route = useRouter();
  const updateProduct = useUpdateProduct();
  const { data: genres } = useGetProductGenre();
  const { data: cpsData } = useGetProductCpCompany();

  const [showCancelPopup, setShowCancelPopup] = useState(false);
  // 🟡 States form
  const [title, setTitle] = useState("");
  const [ratingsCode, setRatingsCode] = useState("15");
  const [primaryGenreId, setPrimaryGenreId] = useState<number>(0);
  const [subGenreId, setSubGenreId] = useState<number>(0);
  const [statusCode, setStatusCode] = useState("연재중");
  const [uci, setUci] = useState("");
  const [isbn, setIsbn] = useState("");
  const [seriesPrice, setSeriesPrice] = useState<string>("");
  const [singlePrice, setSinglePrice] = useState<string>("");
  const [isBlind, setIsBlind] = useState(false);
  // const [cpId, setCpId] = useState<number>(0);
  // const [monopolyYn, setMonopolyYn] = useState<"Y" | "N">("N");
  // const [openYn, setOpenYn] = useState<"Y" | "N">("Y");
  // const [cpOfferedPrice, setCpOfferedPrice] = useState<number>(0);
  // const [cpSettlementRate, setCpSettlementRate] = useState<number>(0);

  const primaryGenreList = useMemo(
    () =>
      genres
        ? genres
            .filter((genre) => genre.major_genre_yn === "Y")
            .map((item) => ({
              value: item.keyword_id + "",
              label: item.keyword_name,
            }))
        : [],
    [genres]
  );
  const subGenreList = useMemo(
    () =>
      genres
        ? genres
            .filter((genre) => genre.major_genre_yn === "Y")
            .map((item) => ({
              value: item.keyword_id + "",
              label: item.keyword_name,
            }))
        : [],
    [genres]
  );

  useEffect(() => {
    if (!product) return;
    setTitle(product.title ?? "");
    setRatingsCode(product.ratings_code ?? "");
    setPrimaryGenreId(product.primary_genre_id ?? 0);
    setSubGenreId(product.sub_genre_id ?? 0);
    setStatusCode(product.status_code ?? "");
    setUci(product.uci ?? "");
    setIsbn(product.isbn ?? "");
    setSeriesPrice((product.series_regular_price ?? "") + "");
    setSinglePrice((product.single_regular_price ?? "") + "");
    setIsBlind(product.blind_yn === "Y" ? true : false);
    // setCpId(product.cp_id ?? 0);
    // setMonopolyYn(product.monopoly_yn ?? "N");
    // setOpenYn(product.open_yn ?? "Y");
    // setCpOfferedPrice(product.cp_offered_price ?? 0);
    // setCpSettlementRate(product.cp_settlement_rate ?? 0);
  }, [product]);

  // 🟡 Submit handler
  const handleSubmit = async () => {
    if (updateProduct.isPending) return;

    // Basic validation
    if (!title.trim()) {
      showAlert("알림", "작품명을 입력해주세요.", "확인");
      return;
    }
    // if (!uci.trim()) {
    //   showAlert("알림", "UCI를 입력해주세요.", "확인");
    //   return;
    // }
    // if (!isbn.trim()) {
    //   showAlert("알림", "ISBN을 입력해주세요.", "확인");
    //   return;
    // }

    const payload: IUpdateProductRequest = {
      title,
      primary_genre_id: primaryGenreId,
      sub_genre_id: subGenreId,
      status_code: statusCode,
      uci,
      isbn,
      series_regular_price: Number(seriesPrice || 0),
      single_regular_price: Number(singlePrice || 0),
      open_yn: isBlind ? "N" : "Y",
      ratings_code: ratingsCode,
      // cp_id: cpId,
      // monopoly_yn: monopolyYn,
      // cp_offered_price: cpOfferedPrice,
      // cp_settlement_rate: cpSettlementRate,
    };

    updateProduct.mutate(
      { id: (product?.product_id || "") + "", body: payload },
      {
        onSuccess: () => route.back(),
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <>
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="작품 정보 수정"
          parent="작품 정보 수정"
          child="작품 리스트"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>{product?.title} 작품 정보</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelPopup(true)}
              >
                취소
              </Button>
              <Button onClick={handleSubmit}>작품수정</Button>
            </div>
          </div>
          <hr />
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="require">작품명</TableHead>
                <TableCell>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">연령등급</TableHead>
                <TableCell>{ratingsCode}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">장르</TableHead>
                <TableCell className="flex gap-2">
                  <Select
                    value={primaryGenreId + ""}
                    onValueChange={(val) => setPrimaryGenreId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {primaryGenreList.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    value={subGenreId + ""}
                    onValueChange={(val) => setSubGenreId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {subGenreList.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">연재 상태</TableHead>
                <TableCell className="flex gap-2">
                  {/* <Select
                    value={statusCode}
                    onValueChange={(val) => setStatusCode(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="연재중">연재중</SelectItem>
                      <SelectItem value="휴재중">휴재중</SelectItem>
                      <SelectItem value="완결">완결</SelectItem>
                    </SelectContent>
                  </Select> */}
                  {statusCodes.map((option) => (
                    // <SelectItem key={option.value} value={option.value}>
                    //   {option.label}
                    // </SelectItem>
                    <Button
                      onClick={() => setStatusCode(option.value)}
                      variant={
                        statusCode === option.value ? "default" : "outline"
                      }
                      key={option.value}
                    >
                      {option.label}
                    </Button>
                  ))}
                  {/* <Button variant="outline">휴재중</Button> */}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>UCI</TableHead>
                <TableCell>
                  <Input
                    value={uci}
                    onChange={(e) => setUci(e.target.value)}
                    placeholder="작품의 UCI를 입력하세요"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>ISBN</TableHead>
                <TableCell>
                  <Input
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="작품의 ISBN을 입력하세요"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>연재 가격</TableHead>
                <TableCell>
                  <Input
                    // type="number"
                    value={seriesPrice}
                    // onChange={(e) => setSeriesPrice(Number(e.target.value))}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isPositiveIntegerInput(value) || value === "") {
                        setSeriesPrice(value === "" ? "" : Number(value) + "");
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>단행본 가격</TableHead>
                <TableCell>
                  <Input
                    // type="number"
                    value={singlePrice}
                    // onChange={(e) => setSinglePrice(Number(e.target.value))}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isPositiveIntegerInput(value) || value === "") {
                        setSinglePrice(value === "" ? "" : Number(value) + "");
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
              {/* <TableRow>
                <TableHead>CP ID</TableHead>
                <TableCell>
                  <Input
                    type="number"
                    value={cpId}
                    onChange={(e) => setCpId(Number(e.target.value))}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>독점 여부</TableHead>
                <TableCell>
                  <Select
                    value={monopolyYn}
                    onValueChange={(val) => setMonopolyYn(val as "Y" | "N")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Y</SelectItem>
                      <SelectItem value="N">N</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>공개 여부</TableHead>
                <TableCell>
                  <Select
                    value={openYn}
                    onValueChange={(val) => setOpenYn(val as "Y" | "N")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Y</SelectItem>
                      <SelectItem value="N">N</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>CP 제안가</TableHead>
                <TableCell>
                  <Input
                    type="number"
                    value={cpOfferedPrice}
                    onChange={(e) => setCpOfferedPrice(Number(e.target.value))}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>CP 정산 비율 (%)</TableHead>
                <TableCell>
                  <Input
                    type="number"
                    value={cpSettlementRate}
                    onChange={(e) =>
                      setCpSettlementRate(Number(e.target.value))
                    }
                  />
                </TableCell>
              </TableRow> */}
              <TableRow>
                <TableHead className="require">작품 블라인드</TableHead>
                <TableCell>
                  <Input
                    type="checkbox"
                    className="w-[36px]"
                    checked={isBlind}
                    readOnly
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <FullPageLoader isLoading={updateProduct.isPending} />
      </SidebarInset>

      {showCancelPopup && (
        <Popup
          title="작품 정보 수정을 취소할까요?"
          content="작성하신 내용은 저장되지 않습니다."
          leftButton="돌아가기"
          rightButton="취소하기"
          onClickLeftButton={() => setShowCancelPopup(false)}
          onClickRightButton={() => route.back()}
        />
      )}
    </>
  );
}

function Page() {
  // const isMobile = useIsMobile()
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { isAdmin, isInitialized } = useProfile();

  const { data: productData } = useGetProductDetail(id || "", !!id);

  if (!isInitialized) {
    return <FullPageLoader isLoading={true} />;
  }

  if (isAdmin) {
    return <AdminPage product={productData} />;
  } else {
    return <AuthorPage product={productData} />;
  }
}

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
