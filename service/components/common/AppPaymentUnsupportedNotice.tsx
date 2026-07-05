import {
  APP_PAYMENT_UNSUPPORTED_MESSAGE,
  APP_PURCHASED_CONTENT_MESSAGE,
} from "@/utils/likenovelApp";

const AppPaymentUnsupportedNotice = ({
  className = "",
}: {
  className?: string;
}) => {
  return (
    <div
      className={`w-full rounded-lg bg-light-gray-100 px-5 py-6 text-center ${className}`}
    >
      <p className="text-16pxr font-semibold text-black-100">
        {APP_PAYMENT_UNSUPPORTED_MESSAGE}
      </p>
      <p className="mt-2 text-14pxr leading-5 text-dark-gray-400">
        {APP_PURCHASED_CONTENT_MESSAGE}
      </p>
    </div>
  );
};

export default AppPaymentUnsupportedNotice;
