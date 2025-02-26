"use client";

// import Alert from "@/components/Alert";
// import Navigation from "@/components/navigation";
import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTeacherPath = pathname?.startsWith("/teacher");

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F6F7FB]">
        {isTeacherPath ? (
          <div className="min-h-screen">{children}</div>
        ) : (
          <div className="min-h-screen flex flex-col">
            {/* Main Content Section */}
            <div className="flex-1 px-4">{children}</div>

            {/* Navigation Section - Fixed at bottom */}
            {/* <div className="flex-1 h-20">
              <Navigation />
            </div> */}
          </div>
        )}
      </body>
    </html>
  );
}
