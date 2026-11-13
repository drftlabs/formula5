import { splitName, activeLabel } from "@/lib/format";

// Placeholder pack shot, used until real product photos are uploaded. Plain white pack, black type, shorter compact bottle.
const JAR = /cream|butter|scrub|mask|lotion|powder|balm/i;
export default function Bottle({ product, scale = 1, className = "", style }) {
  const { short, amount, inci } = splitName(product.name);
  const jar = JAR.test(short);
  return (
    <div className={"bt " + (jar ? "bt-jar " : "") + className} style={{ "--sc": scale, ...style }} aria-hidden="true">
      <i className="bt-cap" />
      <div className="bt-body">
        <img className="bt-logo" src="/logo.png" alt="" width="908" height="160" />
        <span className="bt-rule" />
        <b className="bt-pct">{amount}</b>
        <span className="bt-act">{activeLabel(inci)}</span>
      </div>
    </div>
  );
}
