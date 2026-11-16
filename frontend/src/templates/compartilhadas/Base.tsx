import type { LucideIcon } from "lucide-react";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export function Header({ children, title, subtitle, icon: Icon }: HeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="bg-primary-muted text-primary flex size-12 @3xl:size-16 shrink-0 items-center justify-center rounded-full">
          <Icon className="size-6 @3xl:size-8" />
        </div>

        <div>
          <h1 className="text-text m-0 text-xl @xl:text-2xl @3xl:text-2xl leading-tight font-bold">{title}</h1>
          <p className="text-text-muted m-0 text-xs @3xl:text-base">{subtitle}</p>
        </div>
      </div>
      {children}
    </header>
  );
}

export function Content({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1320px]">{children}</div>;
}

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-5 md:p-8">
      {children}
    </main>
  );
}

export default Main;
