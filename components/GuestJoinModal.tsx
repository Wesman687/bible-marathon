export function GuestJoinModal({
  name,
  onClose,
  setName,
}: {
  name: string;
  onClose: () => void;
  setName: (name: string) => void;
}) {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-[90%] max-w-md">
        <h3 className="text-xl font-semibold mb-4">🧾 Viewer Info</h3>
        <p className="mb-2">Enter your name (or continue as guest):</p>
        <input
          className="w-full border px-3 py-2 rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
            }}
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
