import type { CatalogAction } from "@/lib/catalog";

type ActionLinkProps = {
  action: CatalogAction;
};

const emphasisClassName: Record<CatalogAction["emphasis"], string> = {
  primary: "catalog-button catalog-button--primary",
  secondary: "catalog-button catalog-button--secondary",
};

export function ActionLink({ action }: ActionLinkProps) {
  const className =
    action.kind === "disabled"
      ? "catalog-button catalog-button--disabled"
      : emphasisClassName[action.emphasis];
  const externalProps =
    action.navigation === "new-tab"
      ? { target: "_blank", rel: "noreferrer" }
      : {};

  if (action.kind === "disabled" || !action.href) {
    return (
      <span aria-disabled="true" className={className}>
        {action.label}
      </span>
    );
  }

  if (action.kind === "external") {
    return (
      <a className={className} href={action.href} {...externalProps}>
        {action.label}
      </a>
    );
  }

  return (
    <a className={className} href={action.href} {...externalProps}>
      {action.label}
    </a>
  );
}
