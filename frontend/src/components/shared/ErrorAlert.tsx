interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className="position-fixed top-0 end-0 m-3 alert alert-danger"
      style={{ zIndex: 1050 }}
    >
      {message}
    </div>
  );
}
