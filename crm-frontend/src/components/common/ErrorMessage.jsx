const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <p className="font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
