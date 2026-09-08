export default function PageTitle({ children }: { children: string }) {
  return (
    <div className="page-title">
      <span>{children}</span>
    </div>
  )
}
