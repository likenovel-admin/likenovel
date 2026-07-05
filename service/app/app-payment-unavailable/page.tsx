import AppPaymentUnsupportedNotice from "@/components/common/AppPaymentUnsupportedNotice";

const Page = () => {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-[500px]">
        <AppPaymentUnsupportedNotice />
      </div>
    </main>
  );
};

export default Page;
