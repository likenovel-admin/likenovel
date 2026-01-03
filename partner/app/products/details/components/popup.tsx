import { Button } from "@/components/ui/button";

interface Props {
    title: string,
    content: string,
    leftButton: string,
    rightButton: string,
    onClickLeftButton: () => void,
    onClickRightButton: () => void,
}

const Popup = ({...data}:Props) => {
    return (
        <div className="custom-popup shadow">
            <div className="custom-popup-main">
                <div className="custom-popup-title">{data.title}</div>
                <div className="custom-popup-content">{data.content}</div>
            </div>
            <div className="custom-popup-buttons">
                <Button variant="ghost" onClick={data.onClickLeftButton}>{data.leftButton}</Button>
                <Button variant="ghost" onClick={data.onClickRightButton}>{data.rightButton}</Button>
            </div>
        </div>
    )
}

export default Popup
