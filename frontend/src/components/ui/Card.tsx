import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-bg border-border rounded-xl border p-4 shadow-sm @lg:p-7 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-text text-2xl leading-none font-bold tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-text-muted text-sm ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`mt-6 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface MiniCardProps {
  icon: LucideIcon;
  valor?: number | string | null;
  title: string;
  description: string;
  color: string;
}

export function MiniCard({ icon: Icon, valor, description, title, color }: MiniCardProps) {
  return (
    <div className="border-border min-w-[200px] w-full max-w-4/11 shrink-0 sm:flex-1 rounded-xl border p-3 @xl:p-4">
      <div className="grid min-w-0 grid-cols-[auto_1fr] gap-3">
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full @xl:size-9 ${color} text-black`}
        >
          <Icon className="size-4 @xl:size-5" />
        </div>
        <span className="min-w-0 @lg:truncate text-nowrap text-sm leading-tight font-medium self-center">{title}</span>
        <strong className="col-start-2 block text-2xl font-bold">{valor ?? "—"}</strong>
        <span className="text-text-muted col-start-2 hidden truncate text-xs leading-4 @xl:block">
          {description}
        </span>
      </div>
    </div>
  );
}

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  valor?: number | string | null;
  title: string;
  children?: React.ReactNode;
}

export function MetricCard({ children, title, valor, className = "" }: MetricCardProps) {
  return (
    <Card className={`lg:col-span-6 flex flex-col gap-6 ${className}`}>
      <div className="flex @xl:flex-col items-baseline gap-x-2">
        <p className="text-lg @xl:text-2xl">{title}</p>
        <strong className="block text-4xl font-bold order-first @xl:order-last">
          {valor ?? "—"}
        </strong>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
        {children}
      </div>
    </Card>
  );
}

export default Card;
