import { ReactNode } from "react";
import {
  IAuthorProductEpisodeDropoffRow,
  IAuthorProductInflowDropoffSourceGroup,
} from "@/app/api/query/author/statistics/dto";
import ReaderJourneyFunnel from "./ReaderJourneyFunnel";
import SourceConversionBars from "./SourceConversionBars";
import EpisodeDropoffCurve from "./EpisodeDropoffCurve";

/**
 * 캡처/공유용 "작가 리포트" 카드 (유입/이탈 기준).
 * 페이지에서 보는 실제 시각화(퍼널·전환 막대·이탈 곡선)를 그대로 한 장에 조립한다.
 * 외부 이미지 없이 차트/텍스트만 사용 → html-to-image CORS 안전.
 */

export interface AuthorShareReportData {
  productTitle: string;
  periodLabel: string;
  isSample: boolean;
  detailInflow: number;
  episodeEntry: number;
  firstEpisodeComplete: number | null;
  sourceGroups: IAuthorProductInflowDropoffSourceGroup[];
  episodeDropoffs: IAuthorProductEpisodeDropoffRow[];
  getSourceLabel: (row: IAuthorProductInflowDropoffSourceGroup) => string;
}

export const ReportSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="mt-18pxr border-t border-light-gray-300 pt-14pxr">
    <div className="mb-10pxr text-13pxr font-bold text-black-100">{title}</div>
    {children}
  </div>
);

export const ReportHeader = ({
  productTitle,
  subLabel,
  isSample,
}: {
  productTitle: string;
  subLabel: string;
  isSample: boolean;
}) => (
  <>
    <div className="flex items-center justify-between">
      <span className="text-12pxr font-medium text-dark-gray-400">
        라이크노벨 작가 리포트
      </span>
      {isSample ? (
        <span className="rounded-[4px] bg-light-gray-200 px-6pxr py-2pxr text-11pxr text-dark-gray-400">
          예시
        </span>
      ) : null}
    </div>
    <div className="mt-6pxr text-18pxr font-bold text-black-100">
      {productTitle}
    </div>
    <div className="text-12pxr text-dark-gray-400">{subLabel}</div>
  </>
);

const AuthorShareReport = (props: AuthorShareReportData) => {
  const {
    productTitle,
    periodLabel,
    isSample,
    detailInflow,
    episodeEntry,
    firstEpisodeComplete,
    sourceGroups,
    episodeDropoffs,
    getSourceLabel,
  } = props;

  return (
    <div className="w-[360px] bg-white px-20pxr py-20pxr">
      <ReportHeader
        productTitle={productTitle}
        subLabel={periodLabel}
        isSample={isSample}
      />

      <ReportSection title="독자 여정">
        <ReaderJourneyFunnel
          embedded
          detailInflow={detailInflow}
          episodeEntry={episodeEntry}
          firstEpisodeComplete={firstEpisodeComplete}
        />
      </ReportSection>

      {sourceGroups.length ? (
        <ReportSection title="유입 경로 전환">
          <SourceConversionBars
            embedded
            rows={sourceGroups}
            getLabel={getSourceLabel}
          />
        </ReportSection>
      ) : null}

      {episodeDropoffs.length ? (
        <ReportSection title="회차 잔존 / 이탈">
          <EpisodeDropoffCurve embedded rows={episodeDropoffs} />
        </ReportSection>
      ) : null}
    </div>
  );
};

export default AuthorShareReport;
