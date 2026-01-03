import { useGenre } from "@/contexts/GenreContext";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import { useEffect, useState } from "react";
import Button from "../common/Button";

const genreList = ["전체", "판타지", "현대 판타지", "무협", "드라마"];

const GenreSelectModal = () => {
  // TODO: 장르 가져오는 api 연결
  const { closeModal } = useModalStore();
  const { closeBottomSheet } = useBottomSheetStore();
  const { selectedGenres, setSelectedGenres } = useGenre();
  const [tempSelectedGenres, setTempSelectedGenres] =
    useState<string[]>(selectedGenres);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const inactiveStyle =
    "text-black-100 border border-light-gray-600 hover:bg-light-gray-100";
  const activeStyle =
    "text-white bg-black-100 border border-black-100 hover:bg-dark-gray-600";

  const handleGenreClick = (genre: string) => {
    if (genre === "전체") {
      // When clicking "전체", set only ["전체"] to show all products
      if (isAllSelected) {
        setTempSelectedGenres([]);
      } else {
        setTempSelectedGenres(["전체"]);
      }
    } else {
      setTempSelectedGenres((prev) => {
        // Remove "전체" when selecting specific genres
        const withoutAll = prev.filter((g) => g !== "전체");

        if (withoutAll.includes(genre)) {
          // Deselect the genre
          return withoutAll.filter((g) => g !== genre);
        } else {
          // Select the genre
          return [...withoutAll, genre];
        }
      });
    }
  };

  useEffect(() => {
    // "전체" is selected when tempSelectedGenres contains only "전체"
    setIsAllSelected(
      tempSelectedGenres.length === 1 && tempSelectedGenres[0] === "전체"
    );
  }, [tempSelectedGenres]);

  return (
    <div className="pb-[30px]">
      <div className="flex flex-col items-center px-[50px]">
        <span className="text-22pxr font-bold">
          보고싶은 장르를 선택해주세요
        </span>
        <span className="text-14pxr text-dark-gray-300">
          최대 4개 선택가능합니다.
        </span>
        <div className="flex flex-wrap justify-center w-[300px] md:w-[436px] min-h-[100px] mt-[45px] mb-[10px] gap-5pxr">
          {genreList.map((genre) => (
            <div
              key={genre}
              className={`flex items-center justify-center min-w-[40px] md:min-w-[65px] h-[38px] md:h-[42px] px-[19px] py-[12px] rounded-[100px] cursor-pointer ${
                tempSelectedGenres.includes(genre) ? activeStyle : inactiveStyle
              }`}
              onClick={() => {
                handleGenreClick(genre);
              }}
            >
              <span className="text-13pxr md:text-16pxr">{genre}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 " />
      <div className="flex justify-center gap-8pxr mt-20pxr">
        <Button
          variant="secondary"
          size="xl"
          className="w-[30%] px-[22px] h-[52px] text-18pxr rounded-[10px]"
          onClick={() => {
            closeModal();
            closeBottomSheet();
            setTempSelectedGenres(selectedGenres);
          }}
        >
          취소
        </Button>
        {/* TODO: 확인 클릭 시 선택된 장르로 작품 검색 */}
        <Button
          variant="primary"
          size="xl"
          className="w-[60%] px-[22px] h-[52px] text-18pxr rounded-[10px]"
          onClick={() => {
            setSelectedGenres(tempSelectedGenres);
            closeModal();
            closeBottomSheet();
          }}
        >
          확인
        </Button>
      </div>
    </div>
  );
};

export default GenreSelectModal;
