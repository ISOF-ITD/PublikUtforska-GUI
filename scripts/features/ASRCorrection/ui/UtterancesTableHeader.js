export default function UtterancesTableHeader({ readOnly }) {
  return (
    <div
      className="grid grid-cols-[16px_auto_44px_1fr_auto] gap-6
                      bg-gray-50 text-sm font-medium px-4 py-2 sticky top-0 z-10"
    >
      <span />
      <span>Tid</span>
      <span>Spela</span>
      <span>Text</span>
      {!readOnly && <span className="text-right">Åtgärder</span>}
    </div>
  );
}
