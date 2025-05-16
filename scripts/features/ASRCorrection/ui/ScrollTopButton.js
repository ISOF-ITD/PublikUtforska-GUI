export default function ScrollTopButton() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 right-4 sm:hidden rounded-full p-3 bg-isof
                   text-white shadow-lg"
    >
      ↑
    </button>
  );
}
