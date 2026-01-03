import Image from "next/image";

export default function ImageLoadingTest() {
    return (
        <div
            className="relative flex place-items-center z-[-1] before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
            {/* 1mb -> 76kb*/}
            <Image
                src="https://toodat-kr.s3.amazonaws.com/novel_cover_image/1722985604.112785_312293964/2.jpg"
                alt="thumbsnail image"
                className="aspect-ratio:4/3"
                width={200}
                height={200}
                priority
            />
            {/* 1.3mb -> 102kb*/}
            <Image
                src="https://toodat-kr.s3.amazonaws.com/img/novel-default-cover/Frame_162890.webp"
                alt="thumbsnail image"
                className="aspect-ratio:4/3"
                width={200}
                height={200}
                priority
            />
            {/* 583kb -> 107kb*/}
            <Image
                src="https://toodat-kr.s3.amazonaws.com/novel_cover_image/1723448140.822949_662026662/KakaoTalk_Photo_2024-08-12-16-28-45.jpeg"
                alt="thumbsnail image"
                className="aspect-ratio:4/3"
                width={200}
                height={200}
                priority
            />
            {/* 573kb -> 67.3kb*/}
            <Image
                src="https://toodat-kr.s3.amazonaws.com/novel_cover_image/1724257286.347683_998875182/8_optimized.6.3-%EB%B3%B5%EC%82%AC.png"
                alt="thumbsnail image"
                className="aspect-ratio:4/3"
                width={200}
                height={200}
                priority
            />
            {/* 493kb -> 28.7kb*/}
            <Image
                src="https://toodat-kr.s3.amazonaws.com/novel_cover_image/1722755248.601518_102376771/385738_17226945342.jpg"
                alt="thumbsnail image"
                className="aspect-ratio:4/3"
                width={200}
                height={200}
                priority
            />
        </div>
    )
}
