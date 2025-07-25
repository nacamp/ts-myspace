// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { AppSidebar } from "@/components/app-sidebar";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Myspace",
  description: "Only for me",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body >
        <SidebarProvider>
          <div className="flex h-screen">
            <AppSidebar />
            <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
              {children}
              <Toaster richColors position="top-right" />
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
