import AdminPopup from "@/components/common/AdminPopup";
import {
  ADMIN_POPUP_PRELOAD_SCRIPT_ID,
  buildAdminPopupPreloadScript,
} from "@/constants/adminPopup";
import AuthInitializer from "@/components/common/AuthInitializer";
import Confirm from "@/components/common/Confirm";
import GlobalDeferredModals from "@/components/common/GlobalDeferredModals";
import NavigationTracker from "@/components/common/NavigationTracker";
import SitePageViewTracker from "@/components/common/SitePageViewTracker";
import Spinner from "@/components/common/Spinner";
import Toast from "@/components/common/Toast";
import WithNoSSR from "@/components/common/WithNoSSR";
import ErrorBoundaryWrapper from "@/hooks/useErrorBoundary";
import ReactQueryProvider from "@/hooks/useReactQuery";
import { buildRootMetadata } from "@/utils/siteSeoMetadata";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
});

export const metadata = buildRootMetadata();

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${pretendard.className}`}>
        <script
          id={ADMIN_POPUP_PRELOAD_SCRIPT_ID}
          dangerouslySetInnerHTML={{ __html: buildAdminPopupPreloadScript() }}
        />
        <AdminPopup />
        <WithNoSSR>
          <ReactQueryProvider>
              <ErrorBoundaryWrapper>
                <AuthInitializer />
                <Suspense fallback={null}>
                  <NavigationTracker />
                  <SitePageViewTracker />
                </Suspense>
                <Suspense
                  fallback={
                    <div className="w-full h-screen flex justify-center items-center">
                      <Spinner />
                    </div>
                  }
                >
                  {children}
                  {modal}
                  <div id="modal-root" />
                  <Confirm />
                  <Toast />
                  <GlobalDeferredModals />
                </Suspense>
              </ErrorBoundaryWrapper>
          </ReactQueryProvider>
        </WithNoSSR>
      </body>
    </html>
  );
}
