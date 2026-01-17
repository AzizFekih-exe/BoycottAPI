import { Navbar } from "./Navbar";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 md:px-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} BoycottAPI. All rights reserved.
      </footer>
    </div>
  );
}
