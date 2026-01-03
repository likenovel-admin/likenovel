interface Props {
  current: number;
  max: number;
  index: number; // 부모 컴포넌트에서 map의 index를 전달받습니다
}

const ProgressBar = ({ current, max, index }: Props) => {
  const percentage = (current / max) * 100 > 100 ? 100 : (current / max) * 100;

  const colors = ["#337EFB", "#FFB657", "#57D6FF", "#FF489A"];
  const barColor = colors[index % colors.length]; // 순환적으로 색상 선택

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${percentage}%`,
          backgroundColor: barColor,
        }}
      />
    </div>
  );
};

export default ProgressBar;
