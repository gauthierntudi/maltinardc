type AdminBusyProps = {
  label: string;
  inline?: boolean;
};

export function AdminBusy({ label, inline = false }: AdminBusyProps) {
  if (inline) {
    return (
      <span className="admin-busy-inline" role="status" aria-live="polite">
        <span className="admin-login-spinner admin-login-spinner--inline" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <div className="admin-busy" role="status" aria-live="polite" aria-busy="true">
      <span className="admin-login-spinner" aria-hidden />
      <p className="admin-busy-label">{label}</p>
    </div>
  );
}
