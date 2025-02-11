import "./styles/globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppProvider } from "@/context/AppContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>
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
        </AppProvider>
      </body>
    </html>
  );
}
