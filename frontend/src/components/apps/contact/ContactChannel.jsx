import { Glyph } from "../../ui/Glyph";

export function ContactChannel({ channel, locale, copy, pending, copied }) {
  const labels = locale.channels[channel.id];
  return (
    <article className="contact-channel">
      <span className="contact-channel-icon"><Glyph name={channel.icon} size={24} /></span>
      <div className="contact-channel-details">
        <h2>{labels.label}</h2>
        <bdi className="contact-channel-value" dir="ltr">{channel.value}</bdi>
      </div>
      <div className="contact-channel-actions">
        <a
          href={channel.href}
          target={channel.external ? "_blank" : undefined}
          rel={channel.external ? "noopener noreferrer" : undefined}
          className="contact-action"
        >
          {labels.action}<Glyph name={channel.external ? "external" : channel.icon} size={16} />
        </a>
        <button
          type="button"
          className="contact-copy"
          aria-label={labels.copy}
          disabled={pending}
          onClick={() => copy(channel)}
        >
          <Glyph name={copied ? "check" : "copy"} size={16} />
          {copied ? locale.copied : locale.copy}
        </button>
      </div>
    </article>
  );
}
