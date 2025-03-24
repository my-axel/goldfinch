import "./styles/globals.css";
import { ThemeProvider } from "@/src/frontend/components/layout/theme-provider";
import { SidebarProvider } from "@/src/frontend/components/ui/sidebar"
import { AppSidebar } from "@/frontend/components/layout/AppSidebar";
import { AppProviders } from '@/frontend/providers/AppProviders'
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
                <div className="flex h-screen">
                  <div className="flex">
                    <AppSidebar />
                  </div>
                  <main className="flex-1 py-6 px-8">
                    {children}
                  </main>
                </div>
            </SidebarProvider>
          </ThemeProvider>      
        </AppProviders>
      </body>
    </html>
  );
}
