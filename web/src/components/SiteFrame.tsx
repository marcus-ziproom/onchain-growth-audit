import Link from "next/link";

export function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand"><span className="dot" />ChainPulse Labs</div>
        <nav className="links">
          <Link href="/#offer">Offer</Link>
          <Link href="/#process">Process</Link>
          <Link href="/report-sample">Report Sample</Link>
          <Link href="/intake">Intake</Link>
          <Link className="btn btn-pri" href="/intake">Start Audit</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return <footer className="footer"><div className="container">© 2026 AJAP UK Ltd • Trading as ChainPulse Labs</div></footer>;
}
