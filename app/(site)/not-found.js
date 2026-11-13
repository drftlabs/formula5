import Link from "next/link";
export default function NotFound() {
  return <div className="page"><div className="center"><h1 className="page-title">Page not <em>found</em></h1><p className="lead">That page doesn't exist or has moved.</p><Link className="btn" href="/">Back home</Link></div></div>;
}
