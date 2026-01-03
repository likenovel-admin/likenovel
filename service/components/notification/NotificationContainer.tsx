import NotificationList from "./NotificationList";

const NotificationContainer = () => {
  return (
    <div className="flex w-[400px] items-center flex-col justify-center  mt-20pxr gap-4 border border-gray-300 rounded-xl bg-white shadow-md">
      <div className="absolute top-[13px] mx-auto w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-300 z-10" />
      <div className="absolute top-[14px] mx-auto w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white z-20" />
      <NotificationList />
    </div>
  );
};

export default NotificationContainer;
