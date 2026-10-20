interface NotificationMessageProps {
  message: string;
}

export default function NotificationMessage({ message }: NotificationMessageProps) {
  return (
    <>
      {message.split(/(<strong>.*?<\/strong>)/g).map((part, index) => {
        const match = part.match(/^<strong>(.*?)<\/strong>$/);
        if (!match) return part;

        return <strong key={`${match[1]}-${index}`}>{decodeHtmlEntities(match[1])}</strong>;
      })}
    </>
  );
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}
