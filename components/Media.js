import Link from "next/link";

// Image slot: shows the uploaded image (optionally a separate mobile image) or a clean tinted placeholder until one is added in admin.
export function Media({ src, mobile, alt = "", position = "50% 50%", fit = "cover", priority = false, className = "" }) {
  const img = { alt, decoding: "async", loading: priority ? "eager" : "lazy", fetchPriority: priority ? "high" : undefined };
  return (
    <div className={"media" + (src ? " has-img" : "") + (className ? " " + className : "")} style={{ "--pos": position, "--fit": fit === "contain" ? "contain" : "cover" }}>
      {src && (mobile ? (
        <picture><source media="(max-width:759px)" srcSet={mobile} /><img src={src} {...img} /></picture>
      ) : <img src={src} {...img} />)}
    </div>
  );
}

export function SmartLink({ href = "#", children, ...rest }) {
  if (/^(https?:|mailto:|tel:)/.test(href)) return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" {...rest}>{children}</a>;
  return <Link href={href} {...rest}>{children}</Link>;
}

export const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const lines = (t = "") => String(t).split("|").map((l, i) => <span key={i}>{l}</span>);
