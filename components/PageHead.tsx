export default function PageHead({
  index,
  title,
  lede
}: {
  index: string;
  title: React.ReactNode;
  lede: string;
}) {
  return (
    <header className="page-head">
      <span className="index">{index}</span>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
    </header>
  );
}
