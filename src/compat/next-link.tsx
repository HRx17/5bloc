import { Link as RouterLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
};

/**
 * Drop-in replacement for the old framework's <Link>, so ported pages keep
 * working unchanged. External / hash links fall back to a plain anchor.
 */
export default function Link({
  href,
  prefetch: _prefetch,
  replace,
  scroll: _scroll,
  children,
  ...rest
}: LinkProps) {
  const isInternal =
    typeof href === "string" && href.startsWith("/") && !href.startsWith("//");

  if (!isInternal) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={href} replace={replace === true} {...rest}>
      {children}
    </RouterLink>
  );
}
