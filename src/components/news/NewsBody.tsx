import { Fragment } from "react";

/**
 * Renders a news body as written.
 *
 * Posts are pasted in from WhatsApp, so they arrive as plain text carrying
 * their own line structure, emoji, a registration URL and a phone number.
 * Dropped into a plain <p> all of that collapses into one run-on paragraph
 * with dead links - which is how the Dr Hema post's registration link became
 * unreachable. This keeps the line breaks and makes the links live.
 *
 * Deliberately not a Markdown renderer: the text is not Markdown, and treating
 * it as such would mangle the asterisks and underscores that turn up in
 * pasted-in copy.
 */

// Split rather than replace, so the surrounding text is never re-scanned and a
// phone number inside a URL cannot be matched twice.
const TOKEN =
  /(https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+|\+91[\s-]?\d{5}[\s-]?\d{5}\b|\b[6-9]\d{4}[\s-]?\d{5}\b)/g;

const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

function isUrl(t: string) {
  return /^(https?:\/\/|www\.)/i.test(t);
}

export default function NewsBody({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");

  return (
    <div
      className={`whitespace-pre-line break-words text-[15px] leading-[1.75] text-zinc-700 ${className}`}
    >
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line.split(TOKEN).map((part, j) => {
            if (!part) return null;
            if (!TOKEN.test(part)) {
              TOKEN.lastIndex = 0;
              return <Fragment key={j}>{part}</Fragment>;
            }
            TOKEN.lastIndex = 0;

            // A URL at the end of a sentence swallows the full stop; keep the
            // punctuation as text so the link target stays correct.
            const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
            const token = trailing ? part.slice(0, -trailing.length) : part;

            const href = isUrl(token)
              ? token.startsWith("www.")
                ? `https://${token}`
                : token
              : `tel:${token.replace(/[\s-]/g, "")}`;

            return (
              <Fragment key={j}>
                <a
                  href={href}
                  {...(isUrl(token)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="font-medium text-[#C8541A] underline decoration-[#C8541A]/30 underline-offset-2 hover:decoration-[#C8541A] break-all transition-colors"
                >
                  {token}
                </a>
                {trailing}
              </Fragment>
            );
          })}
          {i < lines.length - 1 ? "\n" : null}
        </Fragment>
      ))}
    </div>
  );
}
