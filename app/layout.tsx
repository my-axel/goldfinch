import "./styles/globals.css";
import { ThemeProvider } from "@/src/frontend/components/layout/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/src/frontend/components/ui/sidebar"
import { AppSidebar } from "@/frontend/components/layout/AppSidebar";
import { AppProviders } from '@/frontend/providers/AppProviders'
import { Toaster } from '@/frontend/components/ui/sonner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goldfinch',
  description: 'Your personal pension portfolio manager',
  icons: {
    icon: '/goldfinch_logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
                <div className="flex h-screen w-full">
                  <div className="flex">
                    <AppSidebar />
                    <div className="flex flex-col pl-2 py-6">
                      <SidebarTrigger />
                    </div>
                  </div>
                  <main className="flex-1 py-6 px-8 overflow-auto w-full text-left">
                    {children}
                  </main>
                </div>
            </SidebarProvider>
            <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>      
        </AppProviders>
      </body>
    </html>
  );
}
