import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from './providers'
import { SessionProvider } from './providers/SessionProvider'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
// import { StagewiseToolbar } from '@stagewise/toolbar-next'
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ViralChef",
  description: "ViralChef",
};

// const stagewiseConfig = {
//   plugins: []
// };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession()

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`h-full ${inter.className}`}>
        <SessionProvider session={session}>
          <Providers>
            {children}
            {/* Stagewise toolbar temporarily disabled due to JSON parsing error */}
            {/* {process.env.NODE_ENV === 'development' && (
              <StagewiseToolbar config={stagewiseConfig} />
            )} */}
          </Providers>
        </SessionProvider>
        <Toaster
          position="bottom-center"
          richColors
          closeButton
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '2367583083616415',
                  xfbml      : true,
                  version    : 'v22.0'
                });
                FB.AppEvents.logPageView();
              };
              (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
              }(document, 'script', 'facebook-jssdk'));
            `,
          }}
        />
      </body>
    </html>
  );
}
