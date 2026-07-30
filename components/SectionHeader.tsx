type SectionHeaderProps = {
  title: string;
  introduction?: string;
  id?: string;
};

export function SectionHeader({ title, introduction, id }: SectionHeaderProps) {
  return (
    <header className="section__header">
      <h2 className="section__title" id={id}>
        {title}
      </h2>
      {introduction ? <p className="section__intro">{introduction}</p> : null}
    </header>
  );
}
