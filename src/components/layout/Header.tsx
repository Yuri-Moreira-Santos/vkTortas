interface HeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function Header({ title, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}pie.svg`} alt="" className="w-7 h-7" />
          <h1 className="text-lg font-semibold text-stone-800">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
