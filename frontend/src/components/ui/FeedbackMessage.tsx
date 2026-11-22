
interface FeedbackMessageProps {
  message?: string | null;
  type: "success" | "error";
}

export default function FeedbackMessage({
  message,
  type,
}: FeedbackMessageProps) {
  if (!message) return null;

  const styles = {
    success: "border-green-600 bg-green-500/15 text-green-600",
    error: "border-red-600 bg-red-500/15 text-red-600",
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mb-4 rounded-xl border-2 px-3 py-2 ${styles[type]}`}
    >
      {message}
    </div>
  );
}
