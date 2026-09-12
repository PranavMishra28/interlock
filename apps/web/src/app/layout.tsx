import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Interlock Control Room",
    template: "%s · Interlock",
  },
  description:
    "A revision-bound operational control plane for authority, enforcement, and evidence.",
  applicationName: "Interlock",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Interlock",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-frame">
          <header className="app-bar">
            <a className="app-brand" href="/" aria-label="Interlock Control Room">
              <img src="/icon.svg" alt="" width="36" height="36" />
              <span>
                <strong>Interlock</strong>
                <small>Control plane</small>
              </span>
            </a>
            <span className="app-environment">
              <i aria-hidden="true" />
              Loopback boundary
            </span>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
