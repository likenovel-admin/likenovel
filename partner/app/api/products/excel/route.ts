import { MeiliSearch } from 'meilisearch'

import * as XLSX from 'xlsx';

export async function GET(request: Request) {
    const workbook = XLSX.utils.book_new();

    //데이터 조회
    const client = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'https://search.likenovel.dev',
        apiKey: process.env.MEILISEARCH_API_KEY || '',
    })

    const result = await client.index('products-all').search('', {page:1, hitsPerPage:1000})
    const products = result['hits']

    //엑셀 데이터 생성
    const worksheet = XLSX.utils.json_to_sheet(products.map((product: any) => ({
        '제목': product.title,
        '작가': product.authorNickname,
        '회차수': product.trendindex?.hasEpisodeCount || 0,
        '조회수': product.trendindex?.hitCount || 0,
        '독자수': product.trendindex?.readedEpisodeCount || 0,
        '북마크': product.trendindex?.bookmarkCount || 0,
        '북마크취소': product.trendindex?.unbookmarkCount || 0,
        '추천수': product.trendindex?.recommendCount || 0,
        '평가자수': product.trendindex?.evaluatedCount || 0,
        'CP조회수': product.trendindex?.cpHitCount || 0,
        '연독률': product.trendindex?.readThroughRate || 0,
        '주평균연재': product.trendindex?.averageWritedCountByWeek || 0,
    })));

    //워크북에 시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, "상품목록");

    //엑셀 파일 생성
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    //응답 헤더 설정
    const headers = new Headers();
    // headers.append('Content-Disposition', 'attachment; filename="discover_product.xlsx"');
    headers.append('Content-Disposition', `attachment; filename="discover_product_${new Date().toISOString().split('T')[1]}.xlsx"`);
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return new Response(excelBuffer, {
        headers: headers
    });
}
