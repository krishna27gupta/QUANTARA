import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quantara - Institutional Finance AI Platform",
  description: "Production-grade stock prediction and financial intelligence dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans min-h-screen bg-background text-foreground`}
      >
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <div className="flex min-h-screen relative">
                {/* Responsive Sidebar for Desktop */}
                <Sidebar />
                
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
                  {/* Header (Top Nav) */}
                  <Header />
                  
                  {/* Page Content */}
                  <main className="flex-1 p-6 overflow-y-auto">
                    <ProtectedRoute>{children}</ProtectedRoute>
                  </main>
                </div>
                
                {/* Mobile Bottom Navigation */}
                <BottomNav />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

