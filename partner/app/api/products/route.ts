import { NextResponse } from 'next/server'
import { MeiliSearch } from 'meilisearch'

export async function POST(request: Request) {

    //파라미터
    /*const {searchParams} = new URL(request.url)
    console.log(">> searchParams:", searchParams.get('search_word'))
    */
    const jsonParams = await request.json()
    // console.log(">> jsonParams:", jsonParams)

    //조회
    const client = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'https://search.likenovel.net',
        apiKey: process.env.MEILISEARCH_API_KEY || '',
    })

    const result = await client.index('products-all').search(jsonParams.search_word, {page:1, hitsPerPage:10, rankingScoreThreshold:0.9, matchingStrategy:'all'})
    return NextResponse.json(
        result['hits']
    )
}
