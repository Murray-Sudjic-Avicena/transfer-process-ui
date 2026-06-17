// Props sent down from TransferPage components

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBox({ value, onChange }: Props) {
  return (
    <div className="search-box">
      <label htmlFor="tx-search">Search:</label>
      <input
        id="tx-search"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Filter transfers…"
      />
    </div>
  );
}
