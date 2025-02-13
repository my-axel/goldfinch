import "./styles/globals.css";
import { ThemeProvider } from "@/src/frontend/components/layout/theme-provider";
import { SidebarProvider } from "@/src/frontend/components/ui/sidebar"
import { AppSidebar } from "@/frontend/components/layout/AppSidebar";
import { AppProviders } from '@/frontend/providers/AppProviders'

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
              <AppSidebar />
              <main className="ml-[100px] min-h-screen px-16">     
                <div className="mx-auto h-full w-full max-w-[1440px] py-16">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </ThemeProvider>      
        </AppProviders>
      </body>
    </html>
  );
}
