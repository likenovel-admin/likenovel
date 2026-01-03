import { NextResponse } from 'next/server'
import { MeiliSearch } from 'meilisearch'
// import { PrismaClient } from "@prisma/client";
// const client = new PrismaClient();

export async function POST(request: Request) {

    //파라미터
    const {searchParams} = new URL(request.url)
    // const jsonParams = await request.json()
    console.log(">> searchParams:", searchParams)

    const client = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || `https://${process.env.MEILISEARCH_HOST}`,
        apiKey: process.env.MEILISEARCH_API_KEY || '',
    })

    //DB조회
    /*const allProducts = await client.tb_product.findMany({
        skip: 0,
        take: 1,
        orderBy: {
            updated_at: 'desc'
        }
    })*/

    //응답
    /*return JSON.stringify({
            code: 200,
            data: allProducts,
            msg: 'success'
        }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
    );*/

    /*return NextResponse.json({
        code: 200,
        data: JSON.parse(
            JSON.stringify(
                /!*allProducts
                , (key, value) => typeof value === 'bigint' ? value.toString() : value)*!/
            )
        ),
        msg: 'success'
    })*/

    return NextResponse.json(
        await client.index('products-all').search('세계')
    )
}
