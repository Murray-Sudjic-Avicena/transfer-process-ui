interface Props {
  draftCount: number;
  submitting: boolean;
  onSubmit: () => void;
  onClear: () => void;
}

export default function TransferToolbar({ draftCount, submitting, onSubmit, onClear }: Props) {
  return (
    <div className="tile-toolbar">
      <h2 className="tile-toolbar-title">New Transfer</h2>
      <div className="tile-toolbar-actions">
        <span className="tx-draft-count">{draftCount} row{draftCount === 1 ? '' : 's'} staged</span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClear}
          disabled={submitting || draftCount === 0}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={submitting || draftCount === 0}
        >
          {submitting ? 'Submitting…' : 'Submit Transfer'}
        </button>
      </div> 
    </div>
  );
}
