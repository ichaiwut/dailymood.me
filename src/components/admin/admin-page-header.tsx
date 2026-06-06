import { A } from "./admin-ui";

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 24,
        paddingBottom: 18,
        borderBottom: "1.5px solid var(--w-rule)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13, minWidth: 0 }}>
        {/* file-label tab — a small peach marker, like a tab on a case file */}
        <span
          aria-hidden
          style={{
            width: 8,
            height: 30,
            borderRadius: 4,
            background: "linear-gradient(160deg, var(--peach), var(--purple))",
            flexShrink: 0,
            marginTop: 3,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <h1 style={A.pageTitle}>{title}</h1>
          {subtitle && <p style={A.pageSubtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
