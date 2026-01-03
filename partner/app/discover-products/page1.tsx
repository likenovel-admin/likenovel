'use client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset, SidebarTrigger,
} from "@/components/ui/sidebar"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {RefreshCw, SquareChevronDown} from "lucide-react";
import ExcelIcon from "@/public/excel-icon.svg"
import Image from "next/image";
import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";

interface Product {
  productId?: number;
  productType?: string;
  priceType?: string;
  image?: {
    coverImagePath?: string;
    adultDefaultcoverImagePath?: string;
  };
  title?: string;
  authorNickname?: string;
  trendindex?: {
    hasEpisodeCount?: string;
    hitCount?: string;
    readedEpisodeCount?: string;
    bookmarkCount?: string;
    unbookmarkCount?: string;
    recommendCount?: string;
    evaluatedCount?: string;
    cpHitCount?: string;
    readThroughRate?: string;
    averageWritedCountByWeek?: string;
    interestSustainCount?: string;
    interestLossCount?: string;
    primaryReaderGroup?: string;
    secondaryReaderGroup?: string;
  };
  genre?: string[];
  cpEvaluation1?: string;
  cpEvaluation2?: string;
  cpEvaluation3?: string;
  synopsis?: string;
  illustratorNickname?: string;
  adultYn?: string;
  keywords?: string[];
  properties?: {
    updateFrequency?: string;
    averageWeeklyEpisodes?: number;
    remarkContentSnippet?: string;
    latestEpisodeDate?: string;
  };
  state?: {
    ongoingState?: string;
    convertToPaidState?: string
  };
  createdDate?: string;
  updatedDate?: string;
  authorId?: number;
}

const DiscoverProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const searchWordRef = useRef<HTMLInputElement>(null)
  const route = useRouter()

  /** 작품 목록 조회 */
  const handleFetchProducts = useCallback(async () => {
    return await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({"search_word":searchWordRef.current?.value ?? ""}),
      headers: { 'Content-Type': 'application/json' },
    }).then((response) => response.json())
      .then((result) => {
        /*if(result.code !== 200) {
          alert(result.msg)
        }*/
        //return result.data

        setProducts(result)
      });
  }, [])

  useEffect(() => {
    handleFetchProducts()
  }, [])

  /** 작품 상세 페이지 이동 */
  const handleClickProduct = (productTitle: string) => {
    route.push(`http://${process.env.NEXT_PUBLIC_HOST_PARTNER_URL}/discover-products/chart?productTitle=${encodeURIComponent(productTitle)}`)
  }

  /** 작품 정보 모바일 보기 */
  const handleIndexAsMobile = () => {
    console.log("view mobile");
  }

  const notDisplayMoblie = "hidden md:block"
  const displayOnlyMoblie = "md:hidden"

  const CDN_URL = `https://${process.env.NEXT_PUBLIC_HOST_CDN_URL}` || "https://cdn.likenovel.net"

  return (
      <>
        {/*{isMobile && <SidebarTrigger />}*/}
        <SidebarInset className="bg-[#F9FAFE]">
          <header className="flex h-10 shrink-0 items-center gap-2 mt-6 md:pl-8">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="text-primary text-xs">
                    <BreadcrumbLink href="#">
                      발굴통계
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:pl-14">
            <div className="text-3xl font-semibold mb-2">
              발굴작품 조회
            </div>
            {/*<div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50"/>
              <div className="aspect-video rounded-xl bg-muted/50"/>
              <div className="aspect-video rounded-xl bg-muted/50"/>
            </div>*/}
            <div className="min-h-[100vh] flex-1 rounded-xl bg-white md:min-h-min">
              <div className="m-4">
                <div className="h-8 font-semibold">15회차 이상의 무료 연재작을 조회합니다.</div>
                {/*<ul className="list-disc list-inside text-xs text-[#4A4F58] leading-6 text-pretty">
                  <li>어쩌고 저쩌고 어쩌고 저쩌고</li>
                  <li className="list-none indent-4 leading-3 text-[#82868F]">(어쩌고 저쩌고 어쩌고 저쩌고)</li>
                  <li>ㅣㄴ아ㅓ리ㅏㄴ어라ㅣㅓㄴ이ㅏ러ㅣㅏㅓㅁㄴ이ㅏㅓ라ㅣㅓㅏㅣㄴ어ㅏㅣ러ㅏㅓㄴ이ㅏㅓ라ㅣㅓ나ㅣ어리ㅏㅓㅓㅏㅣ</li>
                  <li>ㅣㄴ아ㅓ리ㅏㄴ어라ㅣㅓㄴ이ㅏ러ㅣㅏㅓㅁㄴ이ㅏㅓ라ㅣㅓㅏㅣㄴ어ㅏㅣ러ㅏㅓㄴ이ㅏㅓ라ㅣㅓ나ㅣ어리ㅏㅓㅓㅏㅣ</li>
                  <li>ㅣㄴ아ㅓ리ㅏㄴ어라ㅣㅓㄴ이ㅏ러ㅣㅏㅓㅁㄴ이ㅏㅓ라ㅣㅓㅏㅣㄴ어ㅏㅣ러ㅏㅓㄴ이ㅏㅓ라ㅣㅓ나ㅣ어리ㅏㅓㅓㅏㅣ</li>
                </ul>*/}
                <div className="h-16 flex items-center gap-2">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue defaultValue={"normal"} placeholder="일반 검색"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {/*<SelectLabel>Fruits</SelectLabel>*/}
                        <SelectItem value="normal">일반 검색</SelectItem>
                        <SelectItem value="story">스토리 검색</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input ref={searchWordRef}/>
                  <Button variant="outline" onClick={() => {
                    if (searchWordRef.current) searchWordRef.current.value = ""
                  }}>
                    <RefreshCw /><span className={`${notDisplayMoblie}`}>초기화</span></Button>
                  <Button onClick={() => handleFetchProducts()}>검색</Button>
                  <Separator orientation="vertical" className={`mx-2 h-4 ${notDisplayMoblie}`} />
                  <div className={`md:flex items-center justify-center gap-1 border border-zinc-300 bg-white rounded-full text-sm cursor-pointer min-w-32 h-9 px-2 ${notDisplayMoblie}`}>
                    <span><Image src={ExcelIcon} alt="excel icon" /></span>
                    <span onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/api/products/excel';
                      link.download = '발굴작품_' + new Date().toISOString().split('T')[0] + '.xlsx';
                      link.click();
                    }}>엑셀 다운로드</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 border-b border-zinc-300 text-[14px] py-1">
                    <div className="min-w-72 md:min-w-80 text-center">작품명</div>
                    <div className={`min-w-28 text-center ${notDisplayMoblie}`}>작가명</div>
                    <div className={`min-w-10 text-center ${displayOnlyMoblie}`}>더보기</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>회차수</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>조회수</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>독자수</div>
                    <div className={`min-w-14 text-center ${notDisplayMoblie}`}>선호작수</div>
                    <div className={`min-w-16 text-center ${notDisplayMoblie}`}>선호해제수</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>추천수</div>
                    <div className={`min-w-16 text-center ${notDisplayMoblie}`}>평가자수</div>
                    <div className={`min-w-16 text-center ${notDisplayMoblie}`}>CP조회수</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>연독률</div>
                    <div className={`min-w-14 text-center ${notDisplayMoblie}`}>주평균<br/>연재횟수</div>
                    <div className={`min-w-14 text-center ${notDisplayMoblie}`}>관심<br/>유지수</div>
                    <div className={`min-w-14 text-center ${notDisplayMoblie}`}>관심<br/>탈락수</div>
                    <div className={`min-w-20 text-center ${notDisplayMoblie}`}>주요타켓1</div>
                    <div className={`min-w-20 text-center ${notDisplayMoblie}`}>주요타켓2</div>
                    <div className={`min-w-14 text-center ${notDisplayMoblie}`}>1차 장르</div>
                    <div className={`min-w-14 text-center ${notDisplayMoblie}`}>2차 장르</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>평가1</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>평가2</div>
                    <div className={`min-w-10 text-center ${notDisplayMoblie}`}>평가3</div>
                  </div>
                  {products.length &&
                      products.map((product, index) => (
                        <div key={index} className="flex items-center gap-2 py-1 text-[14px] cursor-pointer" onClick={() => handleClickProduct(product?.title || '')}>
                            <div className="flex items-center gap-3 min-w-72 md:min-w-80 text-left">
                              <Image src={product?.image?.coverImagePath || `${CDN_URL}/cover/ESokN0lzSgG0um4rn4tBeg.webp`}
                                  width={80} height={0} className="rounded-md" alt={"cover image"}
                              />
                              <span>{product?.title}</span>
                            </div>
                            <div className={`min-w-28 text-center ${notDisplayMoblie}`}>{product?.authorNickname}</div>
                            <div className={`min-w-10 text-center ${displayOnlyMoblie} px-2`} onClick={() => handleIndexAsMobile()}>
                              <SquareChevronDown size={20} strokeWidth={1.25} className="text-zinc-500" />
                            </div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.trendindex?.hasEpisodeCount || "0"}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.trendindex?.hitCount || "0"}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.trendindex?.readedEpisodeCount || "0"} {/*독자수*/}</div>
                            <div className={`min-w-14 text-center ${notDisplayMoblie}`}>{product?.trendindex?.bookmarkCount || "0"}</div>
                            <div className={`min-w-16 text-center ${notDisplayMoblie}`}>{product?.trendindex?.unbookmarkCount || "0"}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.trendindex?.recommendCount || "0"}</div>
                            <div className={`min-w-16 text-center ${notDisplayMoblie}`}>{product?.trendindex?.evaluatedCount || "-"} {/*평가자수*/}</div>
                            <div className={`min-w-16 text-center ${notDisplayMoblie}`}>{product?.trendindex?.cpHitCount || "0"}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.trendindex?.readThroughRate || "0"}</div>
                            <div className={`min-w-14 text-center ${notDisplayMoblie}`}>{product?.trendindex?.averageWritedCountByWeek || "-"} {/*주평균 연재횟수*/}</div>
                            <div className={`min-w-14 text-center ${notDisplayMoblie}`}>{product?.trendindex?.interestSustainCount || "0"}</div>
                            <div className={`min-w-14 text-center ${notDisplayMoblie}`}>{product?.trendindex?.interestLossCount || "0"}</div>
                            <div className={`min-w-20 text-center ${notDisplayMoblie}`}>{product?.trendindex?.primaryReaderGroup || "-"}</div>
                            <div className={`min-w-20 text-center ${notDisplayMoblie}`}>{product?.trendindex?.secondaryReaderGroup || "-"}</div>
                            <div className={`min-w-14 text-center ${notDisplayMoblie}`}>{product?.genre ? product?.genre[0] : ""}</div>
                            <div className={`min-w-14 text-center ${notDisplayMoblie}`}>{product?.genre ? product?.genre[1] : ""}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.cpEvaluation1 || "-"}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.cpEvaluation2 || "-"}</div>
                            <div className={`min-w-10 text-center ${notDisplayMoblie}`}>{product?.cpEvaluation3 || "-"}</div>
                          </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </>
  )
}
export default DiscoverProductsPage
