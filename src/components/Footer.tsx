export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-social">
        <a href="#" aria-label="Discord"><img src="/icons/discord-logo.svg" alt="" /></a>
        <a href="#" aria-label="X"><img src="/icons/x-logo.svg" alt="" /></a>
        <a href="#" aria-label="Telegram"><img src="/icons/telegram-logo.svg" alt="" /></a>
      </div>
      <div className="footer-links">
        <span className="footer-brand">© {new Date().getFullYear()} BreezePocket</span>
        <a href="#">Docs</a>
        <a href="#">Privacy policy</a>
        <a href="#">Terms of service</a>
      </div>
    </footer>
  )
}
