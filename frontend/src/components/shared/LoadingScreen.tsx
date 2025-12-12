interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Loading game...",
}: LoadingScreenProps) {
  return (
    <div className="game-bg d-flex align-items-center justify-content-center">
      <div className="text-white fs-4">{message}</div>
    </div>
  );
}
